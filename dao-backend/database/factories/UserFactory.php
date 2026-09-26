<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<User> */
class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'display_name' => fake()->firstName(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => '+668'.fake()->unique()->numerify('########'),
            'preferred_language' => 'en',
            'country' => 'TH',
            'profile_completed' => true,
        ];
    }
}
