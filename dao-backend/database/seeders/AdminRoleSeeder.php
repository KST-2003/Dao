<?php

namespace Database\Seeders;

use App\Enums\AdminPermission as P;
use App\Models\AdminRole;
use App\Models\AdminUser;
use Illuminate\Database\Seeder;

class AdminRoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            'super_admin' => ['Super Admin', [P::All]],
            'manager' => ['Manager', [P::DashboardView, P::ProductsManage, P::InventoryManage, P::OrdersManage, P::OrdersView, P::CustomersView, P::CustomersManage, P::LoyaltyManage, P::MarketingManage, P::ContentManage, P::ReviewsModerate, P::NotificationsSend, P::AuditView]],
            'content_manager' => ['Content Manager', [P::DashboardView, P::ContentManage, P::ReviewsModerate, P::MarketingManage]],
            'order_manager' => ['Order Manager', [P::DashboardView, P::OrdersManage, P::OrdersView, P::InventoryManage, P::CustomersView]],
            'customer_support' => ['Customer Support', [P::OrdersView, P::CustomersView, P::ReviewsModerate]],
        ];
        foreach ($roles as $slug => [$name, $perms]) {
            AdminRole::query()->updateOrCreate(['slug' => $slug], ['name' => $name, 'permissions' => array_map(fn (P $p) => $p->value, $perms)]);
        }

        // First super admin from env. No default password is ever shipped.
        $email = env('SEED_ADMIN_EMAIL');
        $password = env('SEED_ADMIN_PASSWORD');
        if ($email && $password && strlen($password) >= 12) {
            AdminUser::query()->firstOrCreate(['email' => strtolower($email)], [
                'name' => 'DAO Admin',
                'password' => $password,
                'admin_role_id' => AdminRole::query()->where('slug', 'super_admin')->value('id'),
                'is_active' => true,
            ]);
        } else {
            $this->command?->warn('No admin created. Set SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD (12+ chars) or run: php artisan dao:admin:create you@example.com');
        }
    }
}
