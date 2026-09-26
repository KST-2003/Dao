<?php

namespace App\DTOs;

use App\Models\Coupon;

final readonly class CouponEvaluation
{
    public function __construct(
        public Coupon $coupon,
        public int $discount,
        public bool $freeShipping,
    ) {}
}
