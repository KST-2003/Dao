<?php

namespace App\Services\Orders;

use App\Enums\InventoryReason;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\ShipmentStatus;
use App\Events\OrderCancelled;
use App\Events\OrderPaid;
use App\Events\OrderRefunded;
use App\Events\OrderStatusChanged;
use App\Exceptions\DomainException;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Shipment;
use App\Models\User;
use App\Services\Catalog\InventoryService;
use App\Services\Coupons\CouponService;
use App\Services\Payments\PaymentManager;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Order lifecycle. Every transition is validated by OrderStatus::allowedNext(), recorded in
 * order_status_histories, and announced with an event (listeners handle points/membership/notifications).
 */
class OrderService
{
    public function __construct(
        private readonly InventoryService $inventory,
        private readonly CouponService $coupons,
        private readonly PaymentManager $payments,
    ) {}

    public function transition(Order $order, OrderStatus $to, ?Model $actor, ?string $note = null): Order
    {
        return match ($to) {
            OrderStatus::Paid => $this->markPaid($order, $actor),
            OrderStatus::Cancelled => $this->cancel($order, $actor, $note),
            OrderStatus::Refunded => $this->refund($order, $actor, false, $note),
            default => DB::transaction(function () use ($order, $to, $actor, $note) {
                $locked = $this->lock($order);
                $this->assertTransition($locked, $to);
                $from = $locked->status;
                $locked->status = $to;
                $locked->save();
                if ($to === OrderStatus::Shipped) {
                    $this->shipment($locked)->fill(['status' => ShipmentStatus::InTransit, 'shipped_at' => now()])->save();
                }
                if ($to === OrderStatus::Delivered) {
                    $this->shipment($locked)->fill(['status' => ShipmentStatus::Delivered, 'delivered_at' => now()])->save();
                }
                $this->history($locked, $from, $to, $actor, $note);
                OrderStatusChanged::dispatch($locked, $from, $to);

                // Cash on delivery is paid when delivered.
                if ($to === OrderStatus::Delivered && $locked->payment_method === PaymentMethod::Cod) {
                    $this->confirmPayment($locked, null, $actor);
                }

                return $locked;
            }),
        };
    }

    /** Payment confirmed by a trusted source (signed webhook, or admin for bank transfer / COD). Idempotent. */
    public function markPaid(Order $order, ?Model $actor, ?string $providerReference = null, array $meta = []): Order
    {
        return DB::transaction(function () use ($order, $actor, $providerReference, $meta) {
            $locked = $this->lock($order);
            if ($locked->payment_status === PaymentStatus::Succeeded) {
                return $locked;
            }
            if ($locked->status->isFinal()) {
                throw DomainException::of('ORDER_CLOSED', 409);
            }
            if ($locked->status === OrderStatus::PendingPayment) {
                $from = $locked->status;
                $locked->status = OrderStatus::Paid;
                $locked->save();
                $this->history($locked, $from, OrderStatus::Paid, $actor, null);
                OrderStatusChanged::dispatch($locked, $from, OrderStatus::Paid);
            }
            $this->confirmPayment($locked, $providerReference, $actor, $meta);

            return $locked;
        });
    }

    public function cancel(Order $order, ?Model $actor, ?string $reason = null): Order
    {
        return DB::transaction(function () use ($order, $actor, $reason) {
            $locked = $this->lock($order);
            $this->assertTransition($locked, OrderStatus::Cancelled);
            if ($locked->payment_status === PaymentStatus::Succeeded) {
                throw DomainException::of('ORDER_PAID_USE_REFUND', 409);
            }
            $from = $locked->status;
            $locked->forceFill(['status' => OrderStatus::Cancelled, 'payment_status' => PaymentStatus::Cancelled, 'cancelled_at' => now()])->save();
            $locked->payments()->whereIn('status', [PaymentStatus::Pending->value, PaymentStatus::RequiresAction->value])
                ->update(['status' => PaymentStatus::Cancelled->value]);

            $this->inventory->restoreForOrder($locked->load('items'), InventoryReason::OrderCancelled);
            $this->coupons->release($locked);
            $this->history($locked, $from, OrderStatus::Cancelled, $actor, $reason);

            OrderCancelled::dispatch($locked);
            OrderStatusChanged::dispatch($locked, $from, OrderStatus::Cancelled);

            return $locked;
        });
    }

    /** Customers may cancel only before payment and before packing. */
    public function cancelByCustomer(Order $order, User $user): Order
    {
        if ($order->user_id !== $user->id) {
            throw DomainException::of('NOT_FOUND', 404);
        }
        $cancellable = $order->status === OrderStatus::PendingPayment
            || ($order->status === OrderStatus::Processing && $order->payment_status !== PaymentStatus::Succeeded);
        if (! $cancellable) {
            throw DomainException::of('ORDER_NOT_CANCELLABLE', 409);
        }

        return $this->cancel($order, $user, 'Cancelled by customer');
    }

    public function refund(Order $order, ?Model $actor, bool $restock, ?string $note): Order
    {
        $order = DB::transaction(function () use ($order, $actor, $restock, $note) {
            $locked = $this->lock($order);
            $this->assertTransition($locked, OrderStatus::Refunded);
            if ($locked->payment_status !== PaymentStatus::Succeeded) {
                throw DomainException::of('ORDER_NOT_PAID', 409);
            }

            $payment = $locked->payments()->where('status', PaymentStatus::Succeeded->value)->latest('id')->first();
            $automatic = false;
            if ($payment) {
                $automatic = $this->payments->gatewayForRefund($payment->provider)?->refund($payment, $payment->amount) ?? false;
                $payment->forceFill(['status' => PaymentStatus::Refunded])->save();
            }

            $from = $locked->status;
            $locked->forceFill(['status' => OrderStatus::Refunded, 'payment_status' => PaymentStatus::Refunded, 'refunded_at' => now()])->save();
            if ($restock) {
                $this->inventory->restoreForOrder($locked->load('items'), InventoryReason::OrderRefunded);
            }
            $this->history($locked, $from, OrderStatus::Refunded, $actor, trim(($note ?? '').($automatic ? '' : ' [manual refund required]')));

            OrderRefunded::dispatch($locked);
            OrderStatusChanged::dispatch($locked, $from, OrderStatus::Refunded);

            return $locked;
        });

        return $order;
    }

    public function updateShipment(Order $order, array $data): Shipment
    {
        $shipment = $this->shipment($order);
        $shipment->fill($data)->save();

        return $shipment;
    }

    private function confirmPayment(Order $order, ?string $providerReference, ?Model $actor, array $meta = []): void
    {
        $order->forceFill(['payment_status' => PaymentStatus::Succeeded, 'paid_at' => now()])->save();
        $payment = $order->payments()->latest('id')->first();
        $payment?->forceFill([
            'status' => PaymentStatus::Succeeded,
            'paid_at' => now(),
            'provider_reference' => $providerReference ?? $payment->provider_reference,
            'meta' => array_merge($payment->meta ?? [], $meta, $actor ? ['confirmed_by' => $actor->getMorphClass().':'.$actor->getKey()] : []),
        ])->save();

        OrderPaid::dispatch($order);
    }

    private function lock(Order $order): Order
    {
        return Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();
    }

    private function assertTransition(Order $order, OrderStatus $to): void
    {
        if (! $order->status->canTransitionTo($to)) {
            throw DomainException::of('INVALID_STATUS_TRANSITION', 409, [], ['from' => $order->status->value, 'to' => $to->value]);
        }
    }

    private function shipment(Order $order): Shipment
    {
        return $order->shipment()->first() ?? (new Shipment)->forceFill(['order_id' => $order->id]);
    }

    private function history(Order $order, ?OrderStatus $from, OrderStatus $to, ?Model $actor, ?string $note): void
    {
        OrderStatusHistory::query()->create([
            'order_id' => $order->id,
            'from_status' => $from?->value,
            'to_status' => $to->value,
            'note' => $note ?: null,
            'actor_type' => $actor?->getMorphClass(),
            'actor_id' => $actor?->getKey(),
        ]);
    }
}
