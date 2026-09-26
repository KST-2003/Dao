<?php

use App\Enums\OrderStatus;
use App\Models\InventoryMovement;
use App\Models\Order;

it('blocks adding more than the variant stock', function () {
    customer();
    $v = variant(stock: 2);

    $this->postJson('/api/v1/cart/items', ['variant_id' => $v->id, 'quantity' => 3])
        ->assertStatus(422)->assertJsonPath('code', 'INSUFFICIENT_STOCK')->assertJsonPath('errors.available', 2);
});

it('prices the cart server-side and places a COD order', function () {
    $user = customer();
    $v = variant(price: 59000, stock: 5);

    $this->postJson('/api/v1/cart/items', ['variant_id' => $v->id, 'quantity' => 1])
        ->assertCreated()
        ->assertJsonPath('data.quote.subtotal', 59000)
        ->assertJsonPath('data.quote.shipping_fee', 5000)
        ->assertJsonPath('data.quote.total', 64000)
        ->assertJsonPath('data.quote.points_to_earn', 5);

    $res = placeOrder($user)->assertCreated()
        ->assertJsonPath('data.order.status', 'processing')
        ->assertJsonPath('data.order.grand_total', 64000)
        ->assertJsonPath('data.payment.action', 'collect_on_delivery');

    expect($v->fresh()->stock_quantity)->toBe(4)
        ->and(InventoryMovement::query()->where('product_variant_id', $v->id)->value('quantity_change'))->toBe(-1)
        ->and($user->cart->items()->count())->toBe(0)
        ->and(Order::query()->find($res->json('data.order.id'))->statusHistory)->toHaveCount(1);
});

it('rejects checkout when the total changed since the customer saw it', function () {
    $user = customer();
    $v = variant();
    $this->postJson('/api/v1/cart/items', ['variant_id' => $v->id, 'quantity' => 1]);

    $this->postJson('/api/v1/orders', [
        'address_id' => addressFor($user)->id, 'delivery_method' => 'standard', 'payment_method' => 'cod',
        'expected_total' => 1, 'idempotency_key' => 'k1',
    ])->assertStatus(409)->assertJsonPath('code', 'TOTAL_CHANGED')->assertJsonPath('errors.quote.total', 64000);

    expect(Order::query()->count())->toBe(0)->and($v->fresh()->stock_quantity)->toBe(5);
});

it('reports stock problems instead of silently changing the cart', function () {
    $user = customer();
    $v = variant(stock: 5);
    $this->postJson('/api/v1/cart/items', ['variant_id' => $v->id, 'quantity' => 3]);
    $v->update(['stock_quantity' => 1]);

    $this->getJson('/api/v1/cart')->assertOk()
        ->assertJsonPath('data.issues.0.code', 'insufficient_stock')
        ->assertJsonPath('data.issues.0.available', 1)
        ->assertJsonPath('data.can_checkout', false)
        ->assertJsonPath('data.items.0.quantity', 3); // untouched

    $this->postJson('/api/v1/orders', [
        'address_id' => addressFor($user)->id, 'delivery_method' => 'standard', 'payment_method' => 'cod',
        'expected_total' => 0, 'idempotency_key' => 'k2',
    ])->assertStatus(422)->assertJsonPath('code', 'CART_INVALID');
});

it('is idempotent for the same idempotency key', function () {
    $user = customer();
    $v = variant(stock: 5);
    $this->postJson('/api/v1/cart/items', ['variant_id' => $v->id, 'quantity' => 1]);
    $address = addressFor($user);
    $payload = ['address_id' => $address->id, 'delivery_method' => 'standard', 'payment_method' => 'cod', 'expected_total' => 64000, 'idempotency_key' => 'same-key'];

    $first = $this->postJson('/api/v1/orders', $payload)->assertCreated()->json('data.order.id');
    $second = $this->postJson('/api/v1/orders', $payload)->assertCreated()->json('data.order.id');

    expect($second)->toBe($first)->and(Order::query()->count())->toBe(1)->and($v->fresh()->stock_quantity)->toBe(4);
});

it('keeps VIP-only pieces for VIP members', function () {
    customer();
    $v = variant(productAttributes: ['is_vip_only' => true]);

    $this->postJson('/api/v1/cart/items', ['variant_id' => $v->id, 'quantity' => 1])
        ->assertStatus(403)->assertJsonPath('code', 'VIP_ONLY');
});

it('lets a customer cancel an unpaid order and restores stock', function () {
    $user = customer();
    $v = variant(stock: 3);
    $this->postJson('/api/v1/cart/items', ['variant_id' => $v->id, 'quantity' => 2]);
    $id = placeOrder($user)->json('data.order.id');

    $this->postJson("/api/v1/orders/{$id}/cancel")->assertOk()->assertJsonPath('data.status', 'cancelled');
    expect($v->fresh()->stock_quantity)->toBe(3)
        ->and(Order::query()->find($id)->status)->toBe(OrderStatus::Cancelled);
});

it('does not offer an unconfigured payment method', function () {
    $user = customer();
    $v = variant();
    $this->postJson('/api/v1/cart/items', ['variant_id' => $v->id, 'quantity' => 1]);

    // bank_transfer is enabled in phpunit.xml but has no account details yet → unavailable, not faked
    placeOrder($user, ['payment_method' => 'bank_transfer'])->assertStatus(422)->assertJsonPath('code', 'PAYMENT_METHOD_UNAVAILABLE');
});
