<?php

use App\Enums\DeliveryMethod;
use App\Models\Address;
use App\Models\AdminUser;
use App\Models\Order;
use App\Services\Currency\CurrencyService;
use App\Services\Loyalty\LoyaltyService;
use App\Services\Loyalty\MembershipService;
use App\Services\Orders\OrderService;
use App\Services\Settings\SettingsService;
use Database\Seeders\AdminRoleSeeder;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

function mmk(): array
{
    return ['X-Currency' => 'MMK'];
}

function setRate(float $rate): void
{
    app(SettingsService::class)->set(['currency.mmk_per_thb' => $rate]);
}

function mmAddress($user): Address
{
    return Address::factory()->create(['user_id' => $user->id, 'country_code' => 'MM', 'region' => 'Yangon', 'phone' => '+959123456789']);
}

function enableMmkBank(): void
{
    app(SettingsService::class)->set(['payments.bank_transfer_mmk' => ['bank_name' => 'KBZ', 'account_name' => 'DAO MM', 'account_number' => '999-000']]);
}

it('converts THB prices at the admin-set rate when a product has no MMK price', function () {
    setRate(120);
    $v = variant(price: 59000, productAttributes: ['sale_price' => 49000, 'member_price' => 45000]);

    $thb = $this->getJson("/api/v1/products/{$v->product_id}")->assertOk();
    expect($thb->json('data.price'))->toBe(59000)->and($thb->json('data.currency'))->toBe('THB');

    $res = $this->getJson("/api/v1/products/{$v->product_id}", mmk())->assertOk();
    expect($res->json('data.currency'))->toBe('MMK')
        ->and($res->json('data.price'))->toBe(59000 * 120)
        ->and($res->json('data.sale_price'))->toBe(49000 * 120)
        ->and($res->json('data.member_price'))->toBe(45000 * 120)
        ->and($res->json('data.variants.0.list_price'))->toBe(49000 * 120);
});

it('uses the product\'s own MMK prices when the admin set them, ignoring the rate', function () {
    setRate(120);
    $v = variant(price: 59000, productAttributes: ['sale_price' => 49000, 'price_mmk' => 9000000, 'sale_price_mmk' => 8000000, 'member_price_mmk' => 7500000]);

    $res = $this->getJson("/api/v1/products/{$v->product_id}", mmk())->assertOk();
    expect($res->json('data.price'))->toBe(9000000)->and($res->json('data.sale_price'))->toBe(8000000)
        ->and($res->json('data.member_price'))->toBe(7500000)->and($res->json('data.discount_percent'))->toBe(11);
    // THB is untouched.
    $this->getJson("/api/v1/products/{$v->product_id}")->assertJsonPath('data.price', 59000)->assertJsonPath('data.sale_price', 49000);
});

it('has no MMK sale when MMK pricing is explicit and no MMK sale price was set', function () {
    $v = variant(price: 59000, productAttributes: ['sale_price' => 49000, 'price_mmk' => 9000000]);

    $this->getJson("/api/v1/products/{$v->product_id}", mmk())->assertJsonPath('data.price', 9000000)->assertJsonPath('data.sale_price', null);
});

it('falls back to THB for an unknown currency header', function () {
    $v = variant(price: 59000);
    $this->getJson("/api/v1/products/{$v->product_id}", ['X-Currency' => 'USD'])->assertJsonPath('data.currency', 'THB')->assertJsonPath('data.price', 59000);
});

it('quotes the cart in MMK with converted prices, delivery fees and a THB-based points preview', function () {
    setRate(100);
    $user = customer();
    $v = variant(price: 100000, stock: 5);
    mmAddress($user);
    $this->postJson('/api/v1/cart/items', ['variant_id' => $v->id, 'quantity' => 1], mmk())->assertCreated();

    app(SettingsService::class)->set(['shipping.air_cargo_fee_mmk' => 4000000]);
    $air = $this->postJson('/api/v1/checkout/quote', ['delivery_method' => 'air_cargo'], mmk())->assertOk();
    expect($air->json('data.currency'))->toBe('MMK')
        ->and($air->json('data.subtotal'))->toBe(10000000)
        ->and($air->json('data.shipping_fee'))->toBe(4000000) // the admin's own MMK fee
        ->and($air->json('data.total'))->toBe(14000000);

    $land = $this->postJson('/api/v1/checkout/quote', ['delivery_method' => 'land_cargo'], mmk())->assertOk();
    expect($land->json('data.shipping_fee'))->toBe(30000 * 100); // no MMK fee set → ฿300 converted

    $tier = app(MembershipService::class)->currentTier($user);
    expect($air->json('data.points_to_earn'))->toBe(app(LoyaltyService::class)->purchasePoints(100000, $tier)); // earned on ฿1,000, not K 100,000
});

it('offers Thailand or Myanmar delivery methods by the address country, with fees in the customer\'s currency', function () {
    $user = customer();
    $th = addressFor($user);
    $mm = mmAddress($user);
    app(SettingsService::class)->set(['shipping.air_cargo_fee' => 50000, 'shipping.land_cargo_fee' => 30000]);

    $thOptions = $this->getJson("/api/v1/checkout/options?address_id={$th->id}")->assertOk();
    expect(collect($thOptions->json('data.delivery_methods'))->pluck('code')->all())->toBe(['standard', 'express']);

    $mmOptions = $this->getJson("/api/v1/checkout/options?address_id={$mm->id}", mmk())->assertOk();
    expect($mmOptions->json('data.country'))->toBe('MM')
        ->and(collect($mmOptions->json('data.delivery_methods'))->pluck('code')->all())->toBe(['air_cargo', 'land_cargo'])
        ->and($mmOptions->json('data.delivery_methods.0.fee'))->toBe(50000 * 100);
});

it('rejects a delivery method that does not belong to the address country', function () {
    $user = customer();
    $v = variant(stock: 5);
    $mm = mmAddress($user);
    $this->postJson('/api/v1/cart/items', ['variant_id' => $v->id, 'quantity' => 1])->assertCreated();

    $this->postJson('/api/v1/orders', [
        'address_id' => $mm->id, 'delivery_method' => 'standard', 'payment_method' => 'cod', 'expected_total' => 0, 'idempotency_key' => (string) Str::uuid(),
    ])->assertStatus(422)->assertJsonPath('code', 'DELIVERY_METHOD_INVALID');
    expect(Order::query()->count())->toBe(0);
});

it('places an MMK order to Myanmar, recording currency and rate, paid to the Myanmar bank', function () {
    setRate(100);
    enableMmkBank();
    $user = customer();
    $v = variant(price: 100000, stock: 5);
    $mm = mmAddress($user);
    $this->postJson('/api/v1/cart/items', ['variant_id' => $v->id, 'quantity' => 1], mmk())->assertCreated();
    $quote = $this->postJson('/api/v1/checkout/quote', ['delivery_method' => 'air_cargo'], mmk())->assertOk()->json('data');

    $res = $this->postJson('/api/v1/orders', [
        'address_id' => $mm->id, 'delivery_method' => 'air_cargo', 'payment_method' => 'bank_transfer',
        'expected_total' => $quote['total'], 'idempotency_key' => (string) Str::uuid(),
    ], mmk())->assertCreated();

    $res->assertJsonPath('data.order.currency', 'MMK')->assertJsonPath('data.order.delivery_method', 'air_cargo')
        ->assertJsonPath('data.payment.action', 'bank_transfer')->assertJsonPath('data.payment.instructions.bank_name', 'KBZ')
        ->assertJsonPath('data.payment.instructions.currency', 'MMK')->assertJsonPath('data.payment.instructions.amount', $quote['total']);
    $order = Order::query()->first();
    expect($order->currency)->toBe('MMK')->and($order->exchange_rate)->toBe(100.0)->and($order->grand_total)->toBe($quote['total']);

    // A later rate change must not move this order's points: they follow the rate it was placed at.
    setRate(200);
    app(OrderService::class)->markPaid($order, null);
    $tier = app(MembershipService::class)->currentTier($user);
    expect($order->fresh()->points_earned)->toBe(app(LoyaltyService::class)->purchasePoints(100000, $tier));
});

it('hides cards and unconfigured banks for MMK, and the Thai bank for MMK orders', function () {
    app(SettingsService::class)->set(['payments.bank_transfer' => ['bank_name' => 'SCB', 'account_name' => 'DAO', 'account_number' => '123', 'promptpay_id' => '']]);
    customer();

    $thb = $this->getJson('/api/v1/checkout/options')->json('data.payment_methods');
    $mmkBefore = $this->getJson('/api/v1/checkout/options', mmk())->json('data.payment_methods');
    expect($thb)->toContain('bank_transfer')->and($mmkBefore)->not->toContain('bank_transfer')->and($mmkBefore)->toContain('cod');

    enableMmkBank();
    expect($this->getJson('/api/v1/checkout/options', mmk())->json('data.payment_methods'))->toContain('bank_transfer');
});

it('exposes the currencies and exchange rate to the app', function () {
    setRate(135.5);
    $this->getJson('/api/v1/config')->assertOk()
        ->assertJsonPath('data.currencies.options', ['THB', 'MMK'])->assertJsonPath('data.currencies.mmk_per_thb', 135.5);
});

it('lets admins set the exchange rate, delivery fees in both currencies, and product MMK prices', function () {
    $this->seed(AdminRoleSeeder::class);
    Sanctum::actingAs(AdminUser::factory()->create(), ['admin']);

    $this->putJson('/api/admin/v1/settings', [
        'currency' => ['mmk_per_thb' => 130.25],
        'shipping' => ['air_cargo_fee' => 60000, 'air_cargo_fee_mmk' => 7000000, 'land_cargo_fee' => 25000],
    ])->assertOk();
    $settings = app(SettingsService::class);
    expect($settings->get('currency.mmk_per_thb'))->toBe(130.25)->and($settings->int('shipping.air_cargo_fee'))->toBe(60000)
        ->and($settings->int('shipping.air_cargo_fee_mmk'))->toBe(7000000);

    // Emptying an MMK fee returns it to "convert the THB fee".
    $this->putJson('/api/admin/v1/settings', ['shipping' => ['air_cargo_fee_mmk' => null]])->assertOk();
    expect($settings->get('shipping.air_cargo_fee_mmk'))->toBe('');
    $this->putJson('/api/admin/v1/settings', ['currency' => ['mmk_per_thb' => 0]])->assertStatus(422);

    $v = variant();
    $this->putJson("/api/admin/v1/products/{$v->product_id}", ['price_mmk' => 9000000, 'sale_price_mmk' => 8000000, 'member_price_mmk' => 7000000])
        ->assertOk()->assertJsonPath('data.price_mmk', 9000000);
    $this->putJson("/api/admin/v1/products/{$v->product_id}", ['sale_price_mmk' => 9500000])->assertStatus(422)->assertJsonPath('code', 'SALE_PRICE_INVALID');
    $this->putJson("/api/admin/v1/products/{$v->product_id}", ['price_mmk' => null, 'sale_price_mmk' => null, 'member_price_mmk' => 5])->assertStatus(422)->assertJsonPath('code', 'MMK_PRICE_REQUIRED');
});

it('reports dashboard revenue and customer spend in THB across currencies', function () {
    $this->seed(AdminRoleSeeder::class);
    $user = customer();
    foreach ([['THB', 1.0, 100000], ['MMK', 100.0, 10000000]] as [$cur, $rate, $total]) {
        Order::query()->create([
            'order_number' => 'T-'.Str::random(6), 'user_id' => $user->id, 'status' => 'delivered', 'payment_status' => 'succeeded', 'payment_method' => 'cod',
            'delivery_method' => 'standard', 'currency' => $cur, 'exchange_rate' => $rate, 'subtotal' => $total, 'grand_total' => $total,
            'shipping_address' => [], 'placed_at' => now(), 'paid_at' => now(),
        ]);
    }
    Sanctum::actingAs(AdminUser::factory()->create(), ['admin']);

    $this->getJson('/api/admin/v1/dashboard')->assertOk()->assertJsonPath('data.revenue', 200000);
    $this->getJson('/api/admin/v1/customers')->assertOk()->assertJsonPath('data.0.total_spent', 200000);
});

it('records pre-orders in the customer\'s currency and carries it to the payable order', function () {
    setRate(100);
    enableMmkBank();
    $user = customer();
    $v = variant(price: 100000, stock: 0, productAttributes: ['preorder_enabled' => true]);
    $mm = mmAddress($user);
    $items = [['variant_id' => $v->id, 'quantity' => 2]];
    $quote = $this->postJson('/api/v1/preorders/quote', ['items' => $items], mmk())->assertOk();
    expect($quote->json('data.currency'))->toBe('MMK')->and($quote->json('data.total'))->toBe(2 * 100000 * 100);

    $id = $this->postJson('/api/v1/preorders', [
        'items' => $items, 'address_id' => $mm->id, 'expected_total' => $quote->json('data.total'), 'idempotency_key' => (string) Str::uuid(),
    ], mmk())->assertCreated()->assertJsonPath('data.currency', 'MMK')->json('data.id');

    $this->seed(AdminRoleSeeder::class);
    Sanctum::actingAs(AdminUser::factory()->create(), ['admin']);
    foreach (['in_review', 'approved'] as $s) {
        $this->postJson("/api/admin/v1/preorders/{$id}/status", ['status' => $s])->assertOk();
    }
    $res = $this->postJson("/api/admin/v1/preorders/{$id}/status", ['status' => 'waiting_payment', 'shipping_fee' => 500000])->assertOk();
    $order = Order::query()->findOrFail($res->json('data.order.id'));
    expect($order->currency)->toBe('MMK')->and($order->exchange_rate)->toBe(100.0)->and($order->grand_total)->toBe(2 * 100000 * 100 + 500000);
});
