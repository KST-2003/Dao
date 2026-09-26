<?php

namespace App\DTOs;

use App\Enums\DeliveryMethod;
use App\Models\Coupon;

/** Server-side price calculation. The client displays it; it never computes totals itself. */
final readonly class Quote
{
    /**
     * @param  list<PricedLine>  $lines
     */
    public function __construct(
        public array $lines,
        public int $subtotal,
        public int $memberDiscount,
        public int $couponDiscount,
        public int $pointsDiscount,
        public int $pointsRedeemed,
        public int $shippingFee,
        public int $total,
        public int $pointsToEarn,
        public DeliveryMethod $deliveryMethod,
        public ?Coupon $coupon = null,
        public string $currency = 'THB',
        public int $freeShippingThreshold = 0,
    ) {}

    public function toArray(): array
    {
        return [
            'currency' => $this->currency,
            'subtotal' => $this->subtotal,
            'member_discount' => $this->memberDiscount,
            'coupon_code' => $this->coupon?->code,
            'coupon_discount' => $this->couponDiscount,
            'points_redeemed' => $this->pointsRedeemed,
            'points_discount' => $this->pointsDiscount,
            'delivery_method' => $this->deliveryMethod->value,
            'shipping_fee' => $this->shippingFee,
            'free_shipping_threshold' => $this->freeShippingThreshold,
            'total' => $this->total,
            'points_to_earn' => $this->pointsToEarn,
        ];
    }
}
