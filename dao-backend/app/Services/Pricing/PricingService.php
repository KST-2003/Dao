<?php

namespace App\Services\Pricing;

use App\DTOs\PricedLine;
use App\DTOs\Quote;
use App\Enums\DeliveryMethod;
use App\Models\CartItem;
use App\Models\MembershipTier;
use App\Models\ProductVariant;
use App\Models\User;
use App\Services\Coupons\CouponService;
use App\Services\Loyalty\LoyaltyService;
use App\Services\Loyalty\MembershipService;
use App\Services\Settings\SettingsService;
use App\Support\Money;

/**
 * The single place where order money is calculated.
 *
 * Order of operations:
 *  1. list price  = variant sale price if on sale, else regular price
 *  2. member price = product.member_price (if lower) or tier discount % (only on non-sale items)
 *  3. coupon       = on eligible lines after member pricing
 *  4. points       = capped at loyalty.redeem_max_percent of what is left
 *  5. shipping     = by delivery method; free over threshold / free-shipping coupon / tier perk (standard only)
 */
class PricingService
{
    public function __construct(
        private readonly MembershipService $membership,
        private readonly CouponService $coupons,
        private readonly LoyaltyService $loyalty,
        private readonly SettingsService $settings,
    ) {}

    /**
     * @param  iterable<CartItem>  $items  items with variant.product loaded
     */
    public function quote(User $user, iterable $items, ?string $couponCode, int $points, DeliveryMethod $delivery): Quote
    {
        $tier = $this->membership->currentTier($user);

        $lines = [];
        foreach ($items as $item) {
            $lines[] = $this->priceLine($item->variant, $item->quantity, $tier, $item);
        }

        $subtotal = array_sum(array_map(fn (PricedLine $l) => $l->listTotal(), $lines));
        $memberDiscount = array_sum(array_map(fn (PricedLine $l) => $l->memberDiscount(), $lines));
        $afterMember = $subtotal - $memberDiscount;

        $coupon = null;
        $couponDiscount = 0;
        $freeShippingCoupon = false;
        if ($couponCode && $lines !== []) {
            $evaluation = $this->coupons->evaluate($couponCode, $user, $lines, $tier);
            $coupon = $evaluation->coupon;
            $couponDiscount = min($evaluation->discount, $afterMember);
            $freeShippingCoupon = $evaluation->freeShipping;
        }
        $afterCoupon = $afterMember - $couponDiscount;

        $pointsDiscount = min($afterCoupon, $this->loyalty->discountForPoints($user, $points, $afterCoupon));

        $threshold = $this->settings->int('shipping.free_threshold');
        $shipping = $lines === [] ? 0 : $this->settings->int($delivery->feeSettingKey());
        if ($delivery === DeliveryMethod::Standard && ($freeShippingCoupon || ($tier?->free_shipping ?? false) || ($threshold > 0 && $afterCoupon >= $threshold))) {
            $shipping = 0;
        }

        $goodsTotal = $afterCoupon - $pointsDiscount;

        return new Quote(
            lines: $lines,
            subtotal: $subtotal,
            memberDiscount: $memberDiscount,
            couponDiscount: $couponDiscount,
            pointsDiscount: $pointsDiscount,
            pointsRedeemed: $pointsDiscount > 0 ? $points : 0,
            shippingFee: $shipping,
            total: $goodsTotal + $shipping,
            pointsToEarn: $this->loyalty->purchasePoints($goodsTotal, $tier),
            deliveryMethod: $delivery,
            coupon: $coupon,
            currency: config('dao.default_currency'),
            freeShippingThreshold: $threshold,
        );
    }

    public function priceLine(ProductVariant $variant, int $quantity, ?MembershipTier $tier, ?CartItem $item = null): PricedLine
    {
        $list = $variant->listPrice();
        $member = $list;
        if ($tier !== null) {
            $memberPrice = $variant->product->member_price;
            if ($memberPrice !== null && $memberPrice < $list) {
                $member = $memberPrice;
            } elseif ((float) $tier->discount_percent > 0 && ! $variant->isOnSale()) {
                $member = $list - Money::percentOf($list, $tier->discount_percent);
            }
        }

        return new PricedLine($variant, $quantity, $list, $member, $item);
    }
}
