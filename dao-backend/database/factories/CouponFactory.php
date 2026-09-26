<?php

namespace Database\Factories;

use App\Enums\CouponScope;
use App\Enums\CouponType;
use App\Models\Coupon;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Coupon> */
class CouponFactory extends Factory
{
    protected $model = Coupon::class;

    public function definition(): array
    {
        return [
            'code' => strtoupper(fake()->unique()->lexify('CODE????')),
            'type' => CouponType::Percentage,
            'value' => 10,
            'min_subtotal' => 0,
            'scope' => CouponScope::All,
            'is_active' => true,
        ];
    }
}
