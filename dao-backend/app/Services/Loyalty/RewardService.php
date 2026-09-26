<?php

namespace App\Services\Loyalty;

use App\Enums\CouponScope;
use App\Enums\CouponType;
use App\Enums\LoyaltyTransactionType;
use App\Enums\RewardType;
use App\Exceptions\DomainException;
use App\Models\Coupon;
use App\Models\Reward;
use App\Models\RewardRedemption;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** Points → reward. V1 rewards issue a personal single-use coupon (or a staff-fulfilled gift). */
class RewardService
{
    public function __construct(
        private readonly LoyaltyService $loyalty,
        private readonly MembershipService $membership,
    ) {}

    public function redeem(User $user, Reward $reward): RewardRedemption
    {
        return DB::transaction(function () use ($user, $reward) {
            $locked = Reward::query()->available()->whereKey($reward->id)->lockForUpdate()->first();
            if (! $locked) {
                throw DomainException::of('REWARD_UNAVAILABLE', 422);
            }
            if ($locked->min_tier_id) {
                $tier = $this->membership->currentTier($user);
                $required = $locked->minTier;
                if (! $tier || $tier->sort_order < $required->sort_order) {
                    throw DomainException::of('REWARD_TIER_REQUIRED', 403);
                }
            }

            $redemption = new RewardRedemption(['reward_id' => $locked->id, 'user_id' => $user->id, 'status' => 'issued']);
            $tx = $this->loyalty->debit($user, LoyaltyTransactionType::Redeemed, $locked->points_cost, $locked, 'Reward '.$locked->code);
            $redemption->loyalty_transaction_id = $tx->id;

            if ($locked->type !== RewardType::Gift) {
                $coupon = Coupon::query()->create([
                    'code' => 'RW'.Str::upper(Str::random(8)),
                    'type' => $locked->type === RewardType::FreeShipping ? CouponType::FreeShipping : ($locked->value_type === 'percent' ? CouponType::Percentage : CouponType::Fixed),
                    'value' => $locked->value,
                    'min_subtotal' => $locked->min_subtotal,
                    'scope' => CouponScope::All,
                    'user_id' => $user->id,
                    'usage_limit' => 1,
                    'usage_limit_per_user' => 1,
                    'description' => 'Reward '.$locked->code,
                    'is_active' => true,
                    'starts_at' => now(),
                    'ends_at' => now()->addDays($locked->coupon_valid_days),
                ]);
                $redemption->coupon_id = $coupon->id;
            } else {
                $redemption->status = 'pending_fulfilment';
            }
            $redemption->save();

            if ($locked->stock !== null) {
                $locked->decrement('stock');
            }

            return $redemption->load('coupon');
        });
    }
}
