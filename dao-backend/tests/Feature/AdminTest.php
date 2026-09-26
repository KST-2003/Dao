<?php

use App\Models\AdminRole;
use App\Models\AdminUser;
use Database\Seeders\AdminRoleSeeder;
use Laravel\Sanctum\Sanctum;

beforeEach(fn () => $this->seed(AdminRoleSeeder::class));

it('logs in with an httpOnly cookie and rejects wrong passwords uniformly', function () {
    AdminUser::factory()->create(['email' => 'ops@dao.test', 'password' => 'correct-horse-battery']);

    $this->postJson('/api/admin/v1/auth/login', ['email' => 'ops@dao.test', 'password' => 'nope'])
        ->assertStatus(401)->assertJsonPath('code', 'INVALID_CREDENTIALS');
    $this->postJson('/api/admin/v1/auth/login', ['email' => 'nobody@dao.test', 'password' => 'nope'])
        ->assertStatus(401)->assertJsonPath('code', 'INVALID_CREDENTIALS');

    $res = $this->postJson('/api/admin/v1/auth/login', ['email' => 'ops@dao.test', 'password' => 'correct-horse-battery'])
        ->assertOk()->assertJsonPath('data.role.slug', 'super_admin');
    $cookie = collect($res->headers->getCookies())->firstWhere(fn ($c) => $c->getName() === 'dao_admin_token');
    expect($cookie)->not->toBeNull()->and($cookie->isHttpOnly())->toBeTrue();
    expect($res->json('data.token'))->toBeNull(); // token never exposed to JS
});

it('enforces role permissions', function () {
    $support = AdminUser::factory()->create(['admin_role_id' => AdminRole::query()->where('slug', 'customer_support')->value('id')]);
    Sanctum::actingAs($support, ['admin']);

    $this->getJson('/api/admin/v1/customers')->assertOk();
    $this->getJson('/api/admin/v1/products')->assertForbidden();
    $this->putJson('/api/admin/v1/settings', [])->assertForbidden();
});

it('never lets a customer token reach the admin API or an admin token act as a customer', function () {
    $customer = App\Models\User::factory()->create();
    Sanctum::actingAs($customer, ['customer']);
    $this->getJson('/api/admin/v1/dashboard')->assertForbidden();

    Sanctum::actingAs(AdminUser::factory()->create(), ['admin']);
    $this->getJson('/api/v1/cart')->assertForbidden();
});

it('creates a product with translations and requires a variant before publishing', function () {
    Sanctum::actingAs(AdminUser::factory()->create(), ['admin']);

    $id = $this->postJson('/api/admin/v1/products', [
        'price' => 59000,
        'translations' => ['en' => ['name' => 'Linen Maxi Dress'], 'th' => ['name' => 'เดรสลินินยาว']],
    ])->assertCreated()->assertJsonPath('data.translations.th.name', 'เดรสลินินยาว')->json('data.id');

    $this->postJson("/api/admin/v1/products/{$id}/publish")->assertStatus(422)->assertJsonPath('code', 'PRODUCT_NEEDS_VARIANT');
    $this->postJson("/api/admin/v1/products/{$id}/variants", ['sku' => 'LMD-BEI-M', 'size' => 'M', 'color' => 'Beige', 'initial_stock' => 4])->assertCreated();
    $this->postJson("/api/admin/v1/products/{$id}/publish")->assertOk()->assertJsonPath('data.status', 'published');

    expect(App\Models\AuditLog::query()->where('action', 'product.created')->exists())->toBeTrue();
});

it('requires the fallback-language name for products', function () {
    Sanctum::actingAs(AdminUser::factory()->create(), ['admin']);

    $this->postJson('/api/admin/v1/products', ['price' => 1000, 'translations' => ['th' => ['name' => 'ไทยเท่านั้น']]])
        ->assertStatus(422)->assertJsonPath('code', 'VALIDATION_FAILED');
});
