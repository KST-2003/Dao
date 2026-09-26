<?php

namespace App\Services\Orders;

use App\DTOs\PaymentInitiation;
use App\DTOs\PlaceOrderData;
use App\DTOs\PricedLine;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Events\OrderPlaced;
use App\Exceptions\DomainException;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Payment;
use App\Models\ProductVariant;
use App\Models\User;
use App\Services\Cart\CartService;
use App\Services\Catalog\InventoryService;
use App\Services\Coupons\CouponService;
use App\Services\Loyalty\LoyaltyService;
use App\Services\Loyalty\MembershipService;
use App\Services\Payments\PaymentManager;
use App\Services\Pricing\PricingService;
use Illuminate\Support\Facades\DB;

/**
 * Place order = one DB transaction that locks the cart + variants, re-validates stock,
 * re-prices server-side, decrements inventory, records coupon + points usage, and empties the
 * purchased cart lines. Payment is initiated AFTER commit (never an HTTP call inside a lock).
 */
class CheckoutService
{
    public function __construct(
        private readonly CartService $cart,
        private readonly PricingService $pricing,
        private readonly InventoryService $inventory,
        private readonly CouponService $coupons,
        private readonly LoyaltyService $loyalty,
        private readonly MembershipService $membership,
        private readonly PaymentManager $payments,
        private readonly OrderNumberGenerator $numbers,
    ) {}

    /** @return array{order: Order, payment: PaymentInitiation} */
    public function placeOrder(User $user, PlaceOrderData $data): array
    {
        if ($data->idempotencyKey) {
            $existing = Order::query()->where('user_id', $user->id)->where('idempotency_key', $data->idempotencyKey)->first();
            if ($existing) {
                return ['order' => $existing, 'payment' => $this->initiatePayment($existing)];
            }
        }

        $gateway = $this->payments->gateway($data->paymentMethod); // fail fast on a disabled method

        $order = DB::transaction(function () use ($user, $data) {
            $cart = Cart::query()->where('user_id', $user->id)->lockForUpdate()->first();
            $items = $cart?->items()->where('saved_for_later', false)->get() ?? collect();
            if ($items->isEmpty()) {
                throw DomainException::of('CART_EMPTY', 422);
            }

            // Lock variants in a stable order to avoid deadlocks, then attach the locked rows.
            $variants = ProductVariant::withTrashed()->with(['product' => fn ($q) => $q->withTrashed()->with(['translations', 'images'])])
                ->whereIn('id', $items->pluck('product_variant_id'))->orderBy('id')->lockForUpdate()->get()->keyBy('id');
            $items->each(fn ($item) => $item->setRelation('variant', $variants[$item->product_variant_id]));

            $issues = $this->cart->blockingIssues($items);
            if ($issues !== []) {
                throw DomainException::of('CART_INVALID', 422, [], ['issues' => $issues]);
            }

            $address = $user->addresses()->find($data->addressId);
            if (! $address) {
                throw DomainException::of('ADDRESS_NOT_FOUND', 422);
            }

            $quote = $this->pricing->quote($user, $items, $data->couponCode, $data->pointsToRedeem, $data->deliveryMethod);
            if ($data->expectedTotal !== null && $data->expectedTotal !== $quote->total) {
                throw DomainException::of('TOTAL_CHANGED', 409, [], ['quote' => $quote->toArray()]);
            }

            $isCod = $data->paymentMethod === PaymentMethod::Cod;
            $order = Order::query()->create([
                'order_number' => $this->numbers->next(),
                'user_id' => $user->id,
                'status' => $isCod ? OrderStatus::Processing : OrderStatus::PendingPayment,
                'payment_status' => PaymentStatus::Pending,
                'payment_method' => $data->paymentMethod,
                'delivery_method' => $data->deliveryMethod,
                'currency' => $quote->currency,
                'subtotal' => $quote->subtotal,
                'member_discount' => $quote->memberDiscount,
                'coupon_discount' => $quote->couponDiscount,
                'points_discount' => $quote->pointsDiscount,
                'shipping_fee' => $quote->shippingFee,
                'grand_total' => $quote->total,
                'points_redeemed' => $quote->pointsRedeemed,
                'coupon_id' => $quote->coupon?->id,
                'coupon_code' => $quote->coupon?->code,
                'membership_tier_id' => $this->membership->currentTier($user)?->id,
                'shipping_address' => $address->toSnapshot(),
                'notes' => $data->notes,
                'idempotency_key' => $data->idempotencyKey,
                'placed_at' => now(),
            ]);

            foreach ($quote->lines as $line) {
                $this->createItem($order, $line);
                $this->inventory->decrementLocked($line->variant, $line->quantity, $order);
                $line->variant->product->increment('sold_count', $line->quantity);
            }

            if ($quote->coupon) {
                $this->coupons->redeem($quote->coupon, $user, $order, $quote->couponDiscount);
            }
            if ($quote->pointsRedeemed > 0) {
                $this->loyalty->redeemForOrder($user, $quote->pointsRedeemed, $order);
            }

            OrderStatusHistory::query()->create([
                'order_id' => $order->id, 'from_status' => null, 'to_status' => $order->status->value,
                'actor_type' => $user->getMorphClass(), 'actor_id' => $user->id,
            ]);

            Payment::query()->create([
                'order_id' => $order->id,
                'provider' => $data->paymentMethod->value,
                'amount' => $order->grand_total,
                'currency' => $order->currency,
                'status' => PaymentStatus::Pending,
            ]);

            $cart->items()->whereIn('id', $items->pluck('id'))->delete();
            $cart->update(['coupon_code' => null, 'points_to_redeem' => 0]);

            OrderPlaced::dispatch($order);

            return $order;
        });

        return ['order' => $order->fresh(['items', 'latestPayment']), 'payment' => $this->initiatePayment($order, $gateway)];
    }

    /** (Re)start payment for an unpaid order, e.g. when the customer closed the Stripe page. */
    public function initiatePayment(Order $order, $gateway = null): PaymentInitiation
    {
        if ($order->payment_status === PaymentStatus::Succeeded || $order->status->isFinal()) {
            return new PaymentInitiation('none');
        }
        $gateway ??= $this->payments->gateway($order->payment_method);
        $payment = $order->payments()->latest('id')->firstOrFail();
        $initiation = $gateway->initiate($order, $payment);

        if ($initiation->providerReference) {
            $payment->forceFill([
                'provider_reference' => $initiation->providerReference,
                'status' => PaymentStatus::RequiresAction,
            ])->save();
        }

        return $initiation;
    }

    private function createItem(Order $order, PricedLine $line): void
    {
        $product = $line->variant->product;
        $order->items()->create([
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
}
