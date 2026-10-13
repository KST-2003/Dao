<?php

namespace App\Services\Orders;

use App\DTOs\PaymentInitiation;
use App\DTOs\PreorderData;
use App\DTOs\PricedLine;
use App\Enums\DeliveryMethod;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PreorderDestination;
use App\Enums\PreorderStatus;
use App\Events\PreorderStatusChanged;
use App\Exceptions\DomainException;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Payment;
use App\Models\Preorder;
use App\Models\PreorderItem;
use App\Models\PreorderStatusHistory;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Services\Cart\CartService;
use App\Services\Loyalty\MembershipService;
use App\Services\Payments\PaymentManager;
use App\Services\Pricing\PricingService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Pre-order lifecycle. Stock is never touched (the goods don't exist yet).
 *
 * submitted → in_review → approved → waiting_payment → in_process → … → completed
 * Payment goes through a linked `orders` row created on waiting_payment, so gateways, points and tier
 * spend use the normal paid-order path; the order's fulfilment status is mirrored from the pre-order.
 */
class PreorderService
{
    public function __construct(
        private readonly PricingService $pricing,
        private readonly MembershipService $membership,
        private readonly CartService $cart,
        private readonly OrderService $orders,
        private readonly CheckoutService $checkout,
        private readonly PaymentManager $payments,
        private readonly OrderNumberGenerator $numbers,
    ) {}

    // ---------- Customer ----------

    /**
     * Authoritative estimate for the pre-order screen (the app never computes totals).
     *
     * @param  list<array{variant_id: int, quantity: int}>  $lines
     * @return array<string, mixed>
     */
    public function quote(User $user, array $lines): array
    {
        $priced = $this->priceLines($user, $lines, false);

        return $this->totals($priced) + [
            'currency' => config('dao.default_currency'),
            'lines' => array_map(fn (PricedLine $l) => [
                'variant_id' => $l->variant->id, 'quantity' => $l->quantity,
                'unit_price' => $l->memberUnitPrice, 'original_unit_price' => $l->listUnitPrice, 'line_total' => $l->netTotal(),
            ], $priced),
        ];
    }

    public function submit(User $user, PreorderData $data): Preorder
    {
        if ($data->idempotencyKey) {
            $existing = Preorder::query()->where('user_id', $user->id)->where('idempotency_key', $data->idempotencyKey)->first();
            if ($existing) {
                return $existing;
            }
        }

        return DB::transaction(function () use ($user, $data) {
            $address = $user->addresses()->find($data->addressId);
            if (! $address) {
                throw DomainException::of('ADDRESS_NOT_FOUND', 422);
            }
            $destination = PreorderDestination::fromCountry($address->country_code)
                ?? throw DomainException::of('PREORDER_DESTINATION_UNSUPPORTED', 422);

            $priced = $this->priceLines($user, $data->lines, true);
            $totals = $this->totals($priced);
            if ($data->expectedTotal !== null && $data->expectedTotal !== $totals['total']) {
                throw DomainException::of('TOTAL_CHANGED', 409, [], ['quote' => $totals]);
            }

            $preorder = Preorder::query()->create([
                'preorder_number' => $this->numbers->nextPreorder(),
                'user_id' => $user->id,
                'status' => PreorderStatus::Submitted,
                'destination' => $destination,
                'currency' => config('dao.default_currency'),
                'subtotal' => $totals['subtotal'],
                'member_discount' => $totals['member_discount'],
                'shipping_fee' => 0,
                'grand_total' => $totals['total'],
                'membership_tier_id' => $this->membership->currentTier($user)?->id,
                'shipping_address' => $address->toSnapshot(),
                'notes' => $data->notes,
                'idempotency_key' => $data->idempotencyKey,
                'submitted_at' => now(),
            ]);

            foreach ($priced as $line) {
                $product = $line->variant->product;
                $preorder->items()->create([
                    'product_id' => $product->id,
                    'product_variant_id' => $line->variant->id,
                    'product_name' => (string) $product->translated('name'),
                    'variant_label' => $line->variant->label() ?: null,
                    'sku' => $line->variant->sku,
                    'image_url' => $product->coverImageUrl(),
                    'unit_price' => $line->memberUnitPrice,
                    'original_unit_price' => $line->listUnitPrice,
                    'quantity' => $line->quantity,
                    'line_total' => $line->netTotal(),
                ]);
            }

            $this->record($preorder, null, PreorderStatus::Submitted, $user, null);
            PreorderStatusChanged::dispatch($preorder, null, PreorderStatus::Submitted);

            return $preorder;
        });
    }

    public function cancelByCustomer(Preorder $preorder, User $user): Preorder
    {
        if ($preorder->user_id !== $user->id) {
            throw DomainException::of('NOT_FOUND', 404);
        }

        return $this->cancel($preorder, $user, 'Cancelled by customer');
    }

    /** (Re)start payment, optionally switching the method. Only while waiting for payment. */
    public function pay(Preorder $preorder, User $user, ?PaymentMethod $method): PaymentInitiation
    {
        if ($preorder->user_id !== $user->id) {
            throw DomainException::of('NOT_FOUND', 404);
        }
        if ($preorder->status !== PreorderStatus::WaitingPayment || ! $preorder->order_id) {
            throw DomainException::of('PREORDER_NOT_AWAITING_PAYMENT', 409);
        }
        if ($method === PaymentMethod::Cod) {
            throw DomainException::of('PAYMENT_METHOD_UNAVAILABLE', 422);
        }

        $order = Order::query()->findOrFail($preorder->order_id);
        $gateway = $this->payments->gateway($method ?? $order->payment_method);

        if ($method !== null && $method !== $order->payment_method) {
            DB::transaction(function () use ($order, $method) {
                $order->forceFill(['payment_method' => $method])->save();
                $order->payments()->latest('id')->first()?->forceFill(['provider' => $method->value])->save();
            });
            $order->refresh();
        }

        return $this->checkout->initiatePayment($order, $gateway);
    }

    // ---------- Staff ----------

    /**
     * @param  array{note?: ?string, shipping_fee?: ?int, carrier?: ?string, tracking_number?: ?string}  $input
     */
    public function transition(Preorder $preorder, PreorderStatus $to, ?Model $actor, array $input = []): Preorder
    {
        if ($to === PreorderStatus::Cancelled) {
            return $this->cancel($preorder, $actor, $input['note'] ?? null);
        }

        return DB::transaction(function () use ($preorder, $to, $actor, $input) {
            $locked = $this->lock($preorder);
            if (! in_array($to, $locked->status->adminNext($locked->destination), true)) {
                throw DomainException::of('INVALID_STATUS_TRANSITION', 409, [], ['from' => $locked->status->value, 'to' => $to->value]);
            }

            $updates = array_filter([
                'carrier' => $input['carrier'] ?? null,
                'tracking_number' => $input['tracking_number'] ?? null,
            ], fn ($v) => $v !== null && $v !== '');

            switch ($to) {
                case PreorderStatus::InReview:
                    $updates['reviewed_at'] = now();
                    break;
                case PreorderStatus::Approved:
                    $updates['approved_at'] = now();
                    break;
                case PreorderStatus::Rejected:
                    $updates['rejected_at'] = now();
                    $updates['reject_reason'] = $input['note'] ?? null;
                    break;
                case PreorderStatus::WaitingPayment:
                    $fee = (int) ($input['shipping_fee'] ?? 0);
                    $updates['shipping_fee'] = $fee;
                    $updates['grand_total'] = $locked->subtotal - $locked->member_discount + $fee;
                    break;
                case PreorderStatus::Completed:
                    $updates['completed_at'] = now();
                    break;
                default:
                    break;
            }

            return $this->apply($locked, $to, $actor, $input['note'] ?? null, $updates);
        });
    }

    /** Staff confirms a bank transfer; the order's OrderPaid event then moves the pre-order to in_process. */
    public function markPaid(Preorder $preorder, ?Model $actor, ?string $reference, string $note): Preorder
    {
        if ($preorder->status !== PreorderStatus::WaitingPayment || ! $preorder->order_id) {
            throw DomainException::of('PREORDER_NOT_AWAITING_PAYMENT', 409);
        }
        $this->orders->markPaid(Order::query()->findOrFail($preorder->order_id), $actor, $reference, ['note' => $note]);

        return $preorder->fresh();
    }

    /** Paid pre-order is refunded; stock is untouched because nothing was ever reserved. */
    public function refund(Preorder $preorder, ?Model $actor, string $note): Preorder
    {
        return DB::transaction(function () use ($preorder, $actor, $note) {
            $locked = $this->lock($preorder);
            if (! $locked->status->isRefundable() || ! $locked->order_id) {
                throw DomainException::of('PREORDER_NOT_REFUNDABLE', 409);
            }
            $this->orders->refund(Order::query()->findOrFail($locked->order_id), $actor, false, $note);

            return $this->apply($locked, PreorderStatus::Refunded, $actor, $note, ['cancelled_at' => now()], syncOrder: false);
        });
    }

    /** OrderPaid listener: the payable order was paid (webhook or staff) → start processing. */
    public function handleOrderPaid(Order $order): void
    {
        if ($order->preorder_id === null) {
            return;
        }
        DB::transaction(function () use ($order) {
            $preorder = Preorder::query()->whereKey($order->preorder_id)->lockForUpdate()->first();
            if ($preorder && $preorder->status === PreorderStatus::WaitingPayment) {
                $this->apply($preorder, PreorderStatus::InProcess, null, null, ['paid_at' => now()]);
            }
        });
    }

    // ---------- Internals ----------

    private function cancel(Preorder $preorder, ?Model $actor, ?string $reason): Preorder
    {
        return DB::transaction(function () use ($preorder, $actor, $reason) {
            $locked = $this->lock($preorder);
            if (! $locked->status->isCancellable()) {
                throw DomainException::of($locked->status->isRefundable() ? 'PREORDER_PAID_USE_REFUND' : 'INVALID_STATUS_TRANSITION', 409);
            }
            if ($locked->order_id) {
                $this->orders->cancel(Order::query()->findOrFail($locked->order_id), $actor, $reason);
            }

            return $this->apply($locked, PreorderStatus::Cancelled, $actor, $reason, ['cancelled_at' => now()], syncOrder: false);
        });
    }

    /** Set the status, write history, mirror onto the order, announce. Caller holds the lock + transaction. */
    private function apply(Preorder $locked, PreorderStatus $to, ?Model $actor, ?string $note, array $updates = [], bool $syncOrder = true): Preorder
    {
        $from = $locked->status;
        $locked->forceFill($updates + ['status' => $to])->save();

        if ($to === PreorderStatus::WaitingPayment) {
            $this->createPayableOrder($locked);
        }
        $this->record($locked, $from, $to, $actor, $note);
        if ($syncOrder) {
            $this->syncOrder($locked, $to);
        }
        PreorderStatusChanged::dispatch($locked, $from, $to);

        return $locked;
    }

    /** Fulfilment of the paid order follows the pre-order: preparing → shipped (on delivery) → delivered. */
    private function syncOrder(Preorder $preorder, PreorderStatus $to): void
    {
        $target = match ($to) {
            PreorderStatus::WaitingCourier, PreorderStatus::Packaging => OrderStatus::Processing,
            PreorderStatus::OnDelivery => OrderStatus::Shipped,
            PreorderStatus::Completed => OrderStatus::Delivered,
            default => null,
        };
        if ($target === null || ! $preorder->order_id) {
            return;
        }
        $order = Order::query()->findOrFail($preorder->order_id);
        if ($order->status->canTransitionTo($target)) {
            $this->orders->advanceForPreorder($order, $target, null);
        }
    }

    private function createPayableOrder(Preorder $preorder): Order
    {
        $order = Order::query()->create([
            'order_number' => $this->numbers->next(),
            'user_id' => $preorder->user_id,
            'preorder_id' => $preorder->id,
            'status' => OrderStatus::PendingPayment,
            'payment_status' => PaymentStatus::Pending,
            // Placeholder until the customer picks a method on the pay screen.
            'payment_method' => PaymentMethod::BankTransfer,
            'delivery_method' => DeliveryMethod::Standard,
            'currency' => $preorder->currency,
            'subtotal' => $preorder->subtotal,
            'member_discount' => $preorder->member_discount,
            'shipping_fee' => $preorder->shipping_fee,
            'grand_total' => $preorder->grand_total,
            'membership_tier_id' => $preorder->membership_tier_id,
            'shipping_address' => $preorder->shipping_address,
            'notes' => $preorder->notes,
            'placed_at' => now(),
        ]);

        /** @var PreorderItem $item */
        foreach ($preorder->items as $item) {
            $order->items()->create([
                'product_id' => $item->product_id,
                'product_variant_id' => $item->product_variant_id,
                'product_name' => $item->product_name,
                'variant_label' => $item->variant_label,
                'sku' => $item->sku,
                'image_url' => $item->getRawOriginal('image_url'),
                'unit_price' => $item->unit_price,
                'original_unit_price' => $item->original_unit_price,
                'quantity' => $item->quantity,
                'line_total' => $item->line_total,
            ]);
        }
        OrderStatusHistory::query()->create(['order_id' => $order->id, 'from_status' => null, 'to_status' => $order->status->value]);
        Payment::query()->create([
            'order_id' => $order->id, 'provider' => $order->payment_method->value,
            'amount' => $order->grand_total, 'currency' => $order->currency, 'status' => PaymentStatus::Pending,
        ]);
        $preorder->forceFill(['order_id' => $order->id])->save();

        return $order;
    }

    /**
     * Validate and price the requested lines for a pre-order.
     *
     * @param  list<array{variant_id: int, quantity: int}>  $lines
     * @return list<PricedLine>
     */
    private function priceLines(User $user, array $lines, bool $lock): array
    {
        $merged = [];
        foreach ($lines as $line) {
            $merged[(int) $line['variant_id']] = ($merged[(int) $line['variant_id']] ?? 0) + (int) $line['quantity'];
        }

        $variants = ProductVariant::query()->with(['product' => fn ($q) => $q->with(['translations', 'images', 'vipMinTier'])])
            ->whereIn('id', array_keys($merged))->orderBy('id')->get()->keyBy('id');
        $productIds = $variants->pluck('product_id')->unique()->sort()->values();
        // Locking the product rows serializes concurrent submissions so the capacity check can't be raced.
        $products = Product::query()->whereIn('id', $productIds)->orderBy('id')
            ->when($lock, fn ($q) => $q->lockForUpdate())->get()->keyBy('id');

        $tier = $this->membership->currentTier($user);
        $priced = [];
        $perProduct = [];
        foreach ($merged as $variantId => $quantity) {
            $variant = $variants[$variantId] ?? null;
            $this->cart->assertPurchasable($user, $variant);
            $product = $products[$variant->product_id];
            if (! $product->preorder_enabled) {
                throw DomainException::of('PREORDER_NOT_AVAILABLE', 422);
            }
            $priced[] = $this->pricing->priceLine($variant, $quantity, $tier);
            $perProduct[$product->id] = ($perProduct[$product->id] ?? 0) + $quantity;
        }

        foreach ($perProduct as $productId => $total) {
            $this->assertLimits($products[$productId], $total);
        }

        return $priced;
    }

    private function assertLimits(Product $product, int $quantity): void
    {
        if ($product->preorder_min_qty !== null && $quantity < $product->preorder_min_qty) {
            throw DomainException::of('PREORDER_QTY_BELOW_MIN', 422, ['min' => $product->preorder_min_qty], ['min' => $product->preorder_min_qty]);
        }
        if ($product->preorder_max_qty !== null && $quantity > $product->preorder_max_qty) {
            throw DomainException::of('PREORDER_QTY_ABOVE_MAX', 422, ['max' => $product->preorder_max_qty], ['max' => $product->preorder_max_qty]);
        }
        if ($product->preorder_capacity !== null) {
            $remaining = max(0, $product->preorder_capacity - $this->committedQuantity($product->id));
            if ($quantity > $remaining) {
                throw DomainException::of('PREORDER_CAPACITY_EXCEEDED', 422, ['remaining' => $remaining], ['remaining' => $remaining]);
            }
        }
    }

    /** Units of a product held by pre-orders that haven't been rejected, cancelled or refunded. */
    public function committedQuantity(int $productId): int
    {
        return (int) PreorderItem::query()->where('product_id', $productId)
            ->whereHas('preorder', fn ($q) => $q->whereNotIn('status', array_map(fn (PreorderStatus $s) => $s->value, PreorderStatus::releasing())))
            ->sum('quantity');
    }

    /** @param  list<PricedLine>  $priced */
    private function totals(array $priced): array
    {
        $subtotal = array_sum(array_map(fn (PricedLine $l) => $l->listTotal(), $priced));
        $discount = array_sum(array_map(fn (PricedLine $l) => $l->memberDiscount(), $priced));

        // Shipping is confirmed by staff on approval, so the estimate excludes it.
        return ['subtotal' => $subtotal, 'member_discount' => $discount, 'shipping_fee' => 0, 'total' => $subtotal - $discount];
    }

    private function record(Preorder $preorder, ?PreorderStatus $from, PreorderStatus $to, ?Model $actor, ?string $note): void
    {
        PreorderStatusHistory::query()->create([
            'preorder_id' => $preorder->id,
            'from_status' => $from?->value,
            'to_status' => $to->value,
            'note' => $note ?: null,
            'actor_type' => $actor?->getMorphClass(),
            'actor_id' => $actor?->getKey(),
        ]);
    }

    private function lock(Preorder $preorder): Preorder
    {
        return Preorder::query()->whereKey($preorder->id)->lockForUpdate()->firstOrFail();
    }
}
