<?php

use App\Models\Coupon;
use App\Models\MembershipTier;

it('applies a percentage coupon above its minimum', function () {
    customer();
    Coupon::factory()->create(['code' => 'DAO10', 'value' => 10, 'min_subtotal' => 50000, 'max_discount' => 5000]);
    $v = variant(price: 59000);
    $this->postJson('/api/v1/cart/items', ['variant_id' => $v->id, 'quantity' => 1]);

    $this->postJson('/api/v1/checkout/quote', ['coupon_code' => 'dao10'])->assertOk()
        ->assertJsonPath('data.coupon_discount', 5000)   // 10% = 5900, capped at 5000
        ->assertJsonPath('data.total', 59000 - 5000 + 5000);
});

it('enforces minimum subtotal, per-user limits and tier restrictions', function () {
    $user = customer();
    $vip = MembershipTier::query()->where('code', 'vip')->firstOrFail();
    Coupon::factory()->create(['code' => 'BIG', 'min_subtotal' => 100000]);
    Coupon::factory()->create(['code' => 'VIPONLY', 'min_tier_id' => $vip->id]);
    Coupon::factory()->create(['code' => 'ONCE', 'usage_limit_per_user' => 1]);
    $v = variant(price: 59000, stock: 10);
    $this->postJson('/api/v1/cart/items', ['variant_id' => $v->id, 'quantity' => 1]);

    $this->postJson('/api/v1/checkout/quote', ['coupon_code' => 'BIG'])->assertStatus(422)->assertJsonPath('code', 'COUPON_MIN_SUBTOTAL');
    $this->postJson('/api/v1/checkout/quote', ['coupon_code' => 'VIPONLY'])->assertStatus(422)->assertJsonPath('code', 'COUPON_TIER_REQUIRED');
    $this->postJson('/api/v1/checkout/quote', ['coupon_code' => 'NOPE'])->assertStatus(422)->assertJsonPath('code', 'COUPON_NOT_FOUND');

    placeOrder($user, ['coupon_code' => 'ONCE'])->assertCreated();
    $this->postJson('/api/v1/cart/items', ['variant_id' => $v->id, 'quantity' => 1]);
    $this->postJson('/api/v1/checkout/quote', ['coupon_code' => 'ONCE'])->assertStatus(422)->assertJsonPath('code', 'COUPON_USER_LIMIT');
});

it('returns the coupon use when an unpaid order is cancelled', function () {
    $user = customer();
    $coupon = Coupon::factory()->create(['code' => 'ONCE', 'usage_limit_per_user' => 1, 'usage_limit' => 1]);
    $v = variant(stock: 10);
    $this->postJson('/api/v1/cart/items', ['variant_id' => $v->id, 'quantity' => 1]);
    $id = placeOrder($user, ['coupon_code' => 'ONCE'])->json('data.order.id');
    expect($coupon->fresh()->used_count)->toBe(1);

    $this->postJson("/api/v1/orders/{$id}/cancel")->assertOk();
    expect($coupon->fresh()->used_count)->toBe(0);
});
