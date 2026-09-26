<?php

namespace Database\Factories;

use App\Models\AdminRole;
use App\Models\AdminUser;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<AdminUser> */
class AdminUserFactory extends Factory
{
    protected $model = AdminUser::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => 'password-123456',
            'is_active' => true,
            'admin_role_id' => fn () => AdminRole::query()->firstOrCreate(['slug' => 'super_admin'], ['name' => 'Super Admin', 'permissions' => ['*']])->id,
        ];
    }
}
