<?php

namespace Database\Factories;

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Address> */
class AddressFactory extends Factory
{
    protected $model = Address::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'recipient_name' => fake()->name(),
            'phone' => '+66812345678',
            'country_code' => 'TH',
            'region' => 'Bangkok',
            'district' => 'Pathum Wan',
            'subdistrict' => 'Lumphini',
            'postal_code' => '10330',
            'address_line1' => '99 Wireless Road',
            'is_default' => true,
        ];
    }
}
