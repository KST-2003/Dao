<?php

namespace App\Enums;

enum RewardType: string
{
    /** Redeeming issues a personal single-use coupon. */
    case DiscountCoupon = 'discount_coupon';
    /** Free shipping coupon. */
    case FreeShipping = 'free_shipping';
    /** Physical gift fulfilled by staff. */
    case Gift = 'gift';
}
