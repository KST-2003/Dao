<?php

use App\Models\Address;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Services\Loyalty\MembershipService;
use App\Services\Settings\SettingsService;
use Database\Seeders\MembershipTierSeeder;
use Database\Seeders\SettingsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

pest()->extend(Tests\TestCase::class)
    ->use(RefreshDatabase::class)
    ->beforeEach(function () {
        $this->seed([MembershipTierSeeder::class, SettingsSeeder::class]);
        app(SettingsService::class)->flush();
    })
    ->in('Feature');

pest()->extend(Tests\TestCase::class)->in('Unit');

/** A signed-in customer (Sanctum token with the `customer` ability). */
function customer(array $attributes = []): User
{
    $user = User::factory()->create($attributes);
    app(MembershipService::class)->ensureMembership($user);
    Sanctum::actingAs($user, ['customer']);

    return $user;
}

function variant(int $price = 59000, int $stock = 5, array $productAttributes = [], array $variantAttributes = []): ProductVariant
{
    $product = Product::factory()->create(array_merge(['price' => $price], $productAttributes));

    return ProductVariant::factory()->create(array_merge(['product_id' => $product->id, 'stock_quantity' => $stock], $variantAttributes));
}

function addressFor(User $user): Address
{
    return Address::factory()->create(['user_id' => $user->id]);
}

function enableBankTransfer(): void
{
    app(SettingsService::class)->set(['payments.bank_transfer' => [
        'bank_name' => 'Test Bank', 'account_name' => 'DAO Co., Ltd.', 'account_number' => '123-4-56789-0', 'promptpay_id' => '',
    ]]);
}

/** Quote → place order, the way the app does it. Returns the JSON response. */
function placeOrder(User $user, array $overrides = []): Illuminate\Testing\TestResponse
{
    $address = $user->addresses()->first() ?? addressFor($user);
    $options = array_merge(['delivery_method' => 'standard', 'payment_method' => 'cod', 'points_to_redeem' => 0, 'coupon_code' => null], $overrides);
    $quote = test()->postJson('/api/v1/checkout/quote', [
        'delivery_method' => $options['delivery_method'],
        'coupon_code' => $options['coupon_code'],
        'points' => $options['points_to_redeem'],
    ])->assertOk()->json('data');

    return test()->postJson('/api/v1/orders', array_merge([
        'address_id' => $address->id,
        'expected_total' => $quote['total'],
        'idempotency_key' => (string) Illuminate\Support\Str::uuid(),
    ], $options));
}
