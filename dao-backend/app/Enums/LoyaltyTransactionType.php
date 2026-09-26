<?php

namespace App\Enums;

enum LoyaltyTransactionType: string
{
    case PurchaseEarned = 'purchase_earned';
    case SignupBonus = 'signup_bonus';
    case ReviewBonus = 'review_bonus';
    case BirthdayBonus = 'birthday_bonus';
    case ReferralBonus = 'referral_bonus';
    case CampaignBonus = 'campaign_bonus';
    case ManualAdjustment = 'manual_adjustment';
    case Redeemed = 'redeemed';
    /** Points returned when an order that used points is cancelled/refunded. */
    case RedemptionReversal = 'redemption_reversal';
    case Expired = 'expired';
    case RefundReversal = 'refund_reversal';

    /** Earning types count toward lifetime points (tier qualification). */
    public function countsTowardLifetime(): bool
    {
        return in_array($this, [
            self::PurchaseEarned, self::SignupBonus, self::ReviewBonus, self::BirthdayBonus,
            self::ReferralBonus, self::CampaignBonus,
        ], true);
    }
}
