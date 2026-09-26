<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AdminRoleSeeder::class,
            SettingsSeeder::class,
            MembershipTierSeeder::class,
            CategorySeeder::class,
        ]);

        // Demo catalog/content only outside production: php artisan db:seed --class=DemoSeeder
        if (! app()->isProduction()) {
            $this->call(DemoSeeder::class);
        }
    }
}
