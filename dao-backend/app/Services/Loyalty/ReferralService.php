<?php

namespace App\Services\Loyalty;

use App\Enums\LoyaltyTransactionType;
use App\Enums\ReferralStatus;
use App\Models\Order;
use App\Models\Referral;
use App\Models\User;
use App\Services\Settings\SettingsService;
use Illuminate\Support\Facades\DB;

/**
 * Referrals are recorded at signup but rewarded ONLY when the referee's first paid order
 * reaches the configured minimum — fake registrations earn nothing.
 */
class ReferralService
{
    public function __construct(
        private readonly SettingsService $settings,
        private readonly LoyaltyService $loyalty,
    ) {}

    public function attach(User $referee, ?string $code): void
    {
        if (! $code) {
            return;
        }
        $referrer = User::query()->where('referral_code', strtoupper(trim($code)))->first();
        if (! $referrer || $referrer->id === $referee->id) {
            return;
        }
        $referee->forceFill(['referred_by_user_id' => $referrer->id])->save();
        Referral::query()->firstOrCreate(
            ['referee_user_id' => $referee->id],
            ['referrer_user_id' => $referrer->id, 'status' => ReferralStatus::Pending],
        );
    }

    public function qualifyOnPaidOrder(Order $order): void
    {
        $referral = Referral::query()->where('referee_user_id', $order->user_id)
            ->where('status', ReferralStatus::Pending->value)->first();
        if (! $referral || $order->eligibleSpend() < $this->settings->int('referral.min_order_total')) {
            return;
        }

        DB::transaction(function () use ($referral, $order) {
            $referral->forceFill([
                'status' => ReferralStatus::Rewarded,
                'qualifying_order_id' => $order->id,
                'rewarded_at' => now(),
            ])->save();

            $referrerBonus = $this->settings->int('referral.referrer_bonus');
            $refereeBonus = $this->settings->int('referral.referee_bonus');
            if ($referrerBonus > 0) {
                $this->loyalty->credit($referral->referrer, LoyaltyTransactionType::ReferralBonus, $referrerBonus, $referral,
                    'Referral reward', "referral_bonus:referrer:{$referral->id}");
            }
            if ($refereeBonus > 0) {
                $this->loyalty->credit($referral->referee, LoyaltyTransactionType::ReferralBonus, $refereeBonus, $referral,
                    'Welcome referral reward', "referral_bonus:referee:{$referral->id}");
            }
        });
    }
}
