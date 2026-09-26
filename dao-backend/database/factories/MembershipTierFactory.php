<?php

namespace Database\Factories;

use App\Models\MembershipTier;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<MembershipTier> */
class MembershipTierFactory extends Factory
{
    protected $model = MembershipTier::class;

    public function definition(): array
    {
        return ['code' => fake()->unique()->slug(1), 'sort_order' => 0, 'min_points' => 0, 'min_spend' => 0, 'discount_percent' => 0, 'points_multiplier' => 1, 'is_active' => true];
    }

    public function configure(): static
    {
        return $this->afterCreating(fn (MembershipTier $t) => $t->syncTranslations(['en' => ['name' => strtoupper($t->code)]]));
    }
}
