<?php

namespace App\Services\Coupons;

use App\DTOs\CouponEvaluation;
use App\DTOs\PricedLine;
use App\Enums\CouponScope;
use App\Enums\CouponType;
use App\Exceptions\DomainException;
use App\Models\Coupon;
use App\Models\CouponRedemption;
use App\Models\MembershipTier;
use App\Models\Order;
use App\Models\User;
use App\Support\Money;
use Illuminate\Support\Facades\DB;

class CouponService
{
    /**
     * @param  list<PricedLine>  $lines
     */
    public function evaluate(string $code, User $user, array $lines, ?MembershipTier $tier): CouponEvaluation
    {
        $coupon = Coupon::query()->with(['products:id', 'categories:id', 'minTier'])->where('code', strtoupper(trim($code)))->first();

        if (! $coupon || ! $coupon->is_active || ($coupon->user_id && $coupon->user_id !== $user->id)) {
            throw DomainException::of('COUPON_NOT_FOUND', 422);
        }
        if ($coupon->starts_at && $coupon->starts_at->isFuture()) {
            throw DomainException::of('COUPON_NOT_STARTED', 422);
        }
        if ($coupon->ends_at && $coupon->ends_at->isPast()) {
            throw DomainException::of('COUPON_EXPIRED', 422);
        }
        if ($coupon->usage_limit !== null && $coupon->used_count >= $coupon->usage_limit) {
            throw DomainException::of('COUPON_USAGE_LIMIT', 422);
        }
        if ($coupon->usage_limit_per_user !== null && $this->userUses($coupon, $user) >= $coupon->usage_limit_per_user) {
            throw DomainException::of('COUPON_USER_LIMIT', 422);
        }
        if ($coupon->minTier && (! $tier || $tier->sort_order < $coupon->minTier->sort_order)) {
            throw DomainException::of('COUPON_TIER_REQUIRED', 422, ['tier' => $coupon->minTier->translated('name')]);
        }

        $eligible = array_values(array_filter($lines, fn (PricedLine $l) => $this->applies($coupon, $l)));
        if ($eligible === []) {
            throw DomainException::of('COUPON_NOT_APPLICABLE', 422);
        }
        $base = array_sum(array_map(fn (PricedLine $l) => $l->netTotal(), $eligible));
        if ($base < $coupon->min_subtotal) {
            throw DomainException::of('COUPON_MIN_SUBTOTAL', 422, [], ['min_subtotal' => $coupon->min_subtotal]);
        }

        $discount = match ($coupon->type) {
            CouponType::Percentage => Money::percentOf($base, min(100, $coupon->value)),
            CouponType::Fixed => min($coupon->value, $base),
            CouponType::FreeShipping => 0,
        };
        if ($coupon->max_discount !== null) {
            $discount = min($discount, $coupon->max_discount);
        }

        return new CouponEvaluation($coupon, $discount, $coupon->type === CouponType::FreeShipping);
    }

    /** Inside the checkout transaction: lock + re-check the global limit, then record usage. */
    public function redeem(Coupon $coupon, User $user, Order $order, int $discount): void
    {
        $locked = Coupon::query()->whereKey($coupon->id)->lockForUpdate()->firstOrFail();
        if ($locked->usage_limit !== null && $locked->used_count >= $locked->usage_limit) {
            throw DomainException::of('COUPON_USAGE_LIMIT', 422);
        }
        $locked->increment('used_count');
        CouponRedemption::query()->create([
            'coupon_id' => $locked->id, 'user_id' => $user->id, 'order_id' => $order->id, 'discount_amount' => $discount,
        ]);
    }

    /** Order cancelled before payment: the coupon use is returned. */
    public function release(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $redemption = CouponRedemption::query()->where('order_id', $order->id)->whereNull('released_at')->lockForUpdate()->first();
            if ($redemption) {
                $redemption->forceFill(['released_at' => now()])->save();
                Coupon::query()->whereKey($redemption->coupon_id)->where('used_count', '>', 0)->decrement('used_count');
            }
        });
    }

    private function userUses(Coupon $coupon, User $user): int
    {
        return CouponRedemption::query()->where('coupon_id', $coupon->id)->where('user_id', $user->id)->whereNull('released_at')->count();
    }

    private function applies(Coupon $coupon, PricedLine $line): bool
    {
        $product = $line->variant->product;

        return match ($coupon->scope) {
            CouponScope::All => true,
            CouponScope::Products => $coupon->products->contains('id', $product->id),
            CouponScope::Categories => $product->category_id !== null && $coupon->categories->contains('id', $product->category_id),
        };
    }
}
