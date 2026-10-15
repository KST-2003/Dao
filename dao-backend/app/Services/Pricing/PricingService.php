<?php

namespace App\Services\Pricing;

use App\DTOs\PricedLine;
use App\DTOs\Quote;
use App\Enums\Currency;
use App\Enums\DeliveryMethod;
use App\Models\CartItem;
use App\Models\MembershipTier;
use App\Models\ProductVariant;
use App\Models\User;
use App\Services\Coupons\CouponService;
use App\Services\Currency\CurrencyService;
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
        private readonly CurrencyService $currency,
    ) {}

    /**
     * @param  iterable<CartItem>  $items  items with variant.product loaded
     */
    public function quote(User $user, iterable $items, ?string $couponCode, int $points, DeliveryMethod $delivery): Quote
    {
        $tier = $this->membership->currentTier($user);
        $currency = $this->currency->current();

        $lines = [];
        foreach ($items as $item) {
            $lines[] = $this->priceLine($item->variant, $item->quantity, $tier, $item, $currency);
        }

        $subtotal = array_sum(array_map(fn (PricedLine $l) => $l->listTotal(), $lines));
        $memberDiscount = array_sum(array_map(fn (PricedLine $l) => $l->memberDiscount(), $lines));
        $afterMember = $subtotal - $memberDiscount;

        $coupon = null;
        $couponDiscount = 0;
        $freeShippingCoupon = false;
        if ($couponCode && $lines !== []) {
            $evaluation = $this->coupons->evaluate($couponCode, $user, $lines, $tier, $currency);
            $coupon = $evaluation->coupon;
            $couponDiscount = min($evaluation->discount, $afterMember);
            $freeShippingCoupon = $evaluation->freeShipping;
        }
        $afterCoupon = $afterMember - $couponDiscount;

        // Points are worth a fixed THB amount, so they are valued (and capped) in THB, then converted to the order currency.
        $pointsDiscountBase = $this->loyalty->discountForPoints($user, $points, $this->currency->toBase($afterCoupon, $currency));
        $pointsDiscount = min($afterCoupon, $this->currency->fromBase($pointsDiscountBase, $currency));

        $threshold = $this->currency->fromBase($this->settings->int('shipping.free_threshold'), $currency);
        $shipping = $lines === [] ? 0 : $this->shippingFee($delivery, $currency);
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
            pointsToEarn: $this->loyalty->purchasePoints($this->currency->toBase($goodsTotal, $currency), $tier),
            deliveryMethod: $delivery,
            coupon: $coupon,
            currency: $currency->value,
            freeShippingThreshold: $threshold,
        );
    }

    /** Delivery fee in $currency: an admin-set MMK fee if there is one, otherwise the THB fee converted at the rate. */
    public function shippingFee(DeliveryMethod $delivery, Currency $currency): int
    {
        if ($currency === Currency::MMK) {
            $own = $this->settings->get($delivery->mmkFeeSettingKey());
            if ($own !== null && $own !== '') {
                return (int) $own;
            }
        }

        return $this->currency->fromBase($this->settings->int($delivery->feeSettingKey()), $currency);
    }

    public function priceLine(ProductVariant $variant, int $quantity, ?MembershipTier $tier, ?CartItem $item = null, ?Currency $currency = null): PricedLine
    {
        $currency ??= $this->currency->current();
        $list = $variant->listPriceIn($currency);
        $member = $list;
        if ($tier !== null) {
            $memberPrice = $this->memberPrice($variant, $currency);
            if ($memberPrice !== null && $memberPrice < $list) {
                $member = $memberPrice;
            } elseif ((float) $tier->discount_percent > 0 && ! $variant->isOnSaleIn($currency)) {
                $member = $list - Money::percentOf($list, $tier->discount_percent);
            }
        }

        return new PricedLine($variant, $quantity, $list, $member, $item);
    }

    /** The product's member price in $currency — but a variant with its own THB override never gets the product's. */
    private function memberPrice(ProductVariant $variant, Currency $currency): ?int
    {
        if ($currency === Currency::MMK && ! $variant->usesProductMmkPrice() && $variant->product->hasOwnMmkPrice()) {
            return $this->currency->fromBase((int) $variant->product->member_price, $currency) ?: null;
        }

        return $variant->product->memberPriceIn($currency);
    }
}
