<?php

use App\Enums\OrderStatus;
use App\Models\AdminUser;
use App\Models\Address;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\Preorder;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

function preorderVariant(array $product = [], int $stock = 0, int $price = 100000)
{
    return variant($price, $stock, array_merge(['preorder_enabled' => true], $product));
}

function submitPreorder($user, $variant, int $qty = 1, array $overrides = [])
{
    $address = $overrides['address'] ?? ($user->addresses()->first() ?? addressFor($user));
    unset($overrides['address']);
    $items = [['variant_id' => $variant->id, 'quantity' => $qty]];
    $quote = test()->postJson('/api/v1/preorders/quote', ['items' => $items])->assertOk()->json('data');

    return test()->postJson('/api/v1/preorders', array_merge([
        'items' => $items, 'address_id' => $address->id,
        'expected_total' => $quote['total'], 'idempotency_key' => (string) Str::uuid(),
    ], $overrides));
}

function asAdmin(): AdminUser
{
    test()->seed(Database\Seeders\AdminRoleSeeder::class);
    $admin = AdminUser::factory()->create();
    Sanctum::actingAs($admin, ['admin']);

    return $admin;
}

function adminMove(int $id, string $status, array $extra = [])
{
    return test()->postJson("/api/admin/v1/preorders/{$id}/status", array_merge(['status' => $status], $extra));
}

it('submits a pre-order without touching stock and snapshots the price', function () {
    $user = customer();
    $v = preorderVariant();

    $res = submitPreorder($user, $v, 2)->assertCreated()
        ->assertJsonPath('data.status', 'submitted')
        ->assertJsonPath('data.destination', 'thailand')
        ->assertJsonPath('data.subtotal', 200000)
        ->assertJsonPath('data.is_estimate', true)
        ->assertJsonPath('data.can_cancel', true);

    expect($v->fresh()->stock_quantity)->toBe(0)
        ->and(InventoryMovement::query()->count())->toBe(0)
        ->and(Order::query()->count())->toBe(0)
        ->and($res->json('data.steps'))->toContain('packaging')->not->toContain('in_transit');
});

it('is idempotent on the key', function () {
    $user = customer();
    $v = preorderVariant();
    $key = 'same-key';

    submitPreorder($user, $v, 1, ['idempotency_key' => $key])->assertCreated();
    submitPreorder($user, $v, 1, ['idempotency_key' => $key])->assertCreated();

    expect(Preorder::query()->count())->toBe(1);
});

it('rejects products that are not open for pre-order', function () {
    $user = customer();
    $v = variant(price: 100000, stock: 0);

    $this->postJson('/api/v1/preorders/quote', ['items' => [['variant_id' => $v->id, 'quantity' => 1]]])
        ->assertStatus(422)->assertJsonPath('code', 'PREORDER_NOT_AVAILABLE');
});

it('enforces the admin min, max and total capacity of a pre-order', function () {
    $user = customer();
    $v = preorderVariant(['preorder_min_qty' => 2, 'preorder_max_qty' => 4, 'preorder_capacity' => 5]);
    $items = fn (int $q) => ['items' => [['variant_id' => $v->id, 'quantity' => $q]]];

    $this->postJson('/api/v1/preorders/quote', $items(1))->assertStatus(422)->assertJsonPath('code', 'PREORDER_QTY_BELOW_MIN')->assertJsonPath('errors.min', 2);
    $this->postJson('/api/v1/preorders/quote', $items(5))->assertStatus(422)->assertJsonPath('code', 'PREORDER_QTY_ABOVE_MAX')->assertJsonPath('errors.max', 4);

    submitPreorder($user, $v, 4)->assertCreated();
    // 1 slot left, but min is 2 → below-min wins; lift min to see capacity.
    $v->product->update(['preorder_min_qty' => null]);
    $this->postJson('/api/v1/preorders/quote', $items(2))->assertStatus(422)->assertJsonPath('code', 'PREORDER_CAPACITY_EXCEEDED')->assertJsonPath('errors.remaining', 1);
    $this->getJson("/api/v1/products/{$v->product_id}")->assertJsonPath('data.preorder.remaining', 1);
});

it('frees capacity when a pre-order is cancelled by the customer', function () {
    $user = customer();
    $v = preorderVariant(['preorder_capacity' => 2]);
    $id = submitPreorder($user, $v, 2)->assertCreated()->json('data.id');

    $this->postJson('/api/v1/preorders/quote', ['items' => [['variant_id' => $v->id, 'quantity' => 1]]])->assertStatus(422);
    $this->postJson("/api/v1/preorders/{$id}/cancel")->assertOk()->assertJsonPath('data.status', 'cancelled');
    $this->postJson('/api/v1/preorders/quote', ['items' => [['variant_id' => $v->id, 'quantity' => 2]]])->assertOk();
});

it('only ships to Thailand or Myanmar', function () {
    $user = customer();
    $v = preorderVariant();
    $sg = Address::factory()->create(['user_id' => $user->id, 'country_code' => 'SG']);

    submitPreorder($user, $v, 1, ['address' => $sg])->assertStatus(422)->assertJsonPath('code', 'PREORDER_DESTINATION_UNSUPPORTED');
});

it('runs the Thailand flow from review to completed, paying via bank transfer', function () {
    enableBankTransfer();
    $user = customer();
    $v = preorderVariant();
    $id = submitPreorder($user, $v, 2)->assertCreated()->json('data.id');

    asAdmin();
    adminMove($id, 'approved')->assertStatus(409)->assertJsonPath('code', 'INVALID_STATUS_TRANSITION'); // must review first
    adminMove($id, 'in_review')->assertOk();
    adminMove($id, 'approved')->assertOk();
    adminMove($id, 'in_process')->assertStatus(409); // only payment can do this
    $res = adminMove($id, 'waiting_payment', ['shipping_fee' => 5000])->assertOk()
        ->assertJsonPath('data.grand_total', 205000)->assertJsonPath('data.can_mark_paid', true);
    $order = Order::query()->findOrFail($res->json('data.order.id'));
    expect($order->preorder_id)->toBe($id)->and($order->status)->toBe(OrderStatus::PendingPayment)->and($order->grand_total)->toBe(205000)->and($order->items)->toHaveCount(1);

    // The linked order can't be driven by hand.
    $this->postJson("/api/admin/v1/orders/{$order->id}/status", ['status' => 'processing'])->assertStatus(409)->assertJsonPath('code', 'ORDER_MANAGED_BY_PREORDER');

    $this->postJson("/api/admin/v1/preorders/{$id}/mark-paid", ['reference' => 'TX1', 'note' => 'slip checked'])->assertOk()
        ->assertJsonPath('data.status', 'in_process');
    expect($order->fresh()->status)->toBe(OrderStatus::Paid);

    adminMove($id, 'waiting_courier')->assertStatus(409); // Thailand has no courier leg
    adminMove($id, 'packaging')->assertOk();
    expect($order->fresh()->status)->toBe(OrderStatus::Processing);
    adminMove($id, 'on_delivery', ['carrier' => 'Flash', 'tracking_number' => 'TH123'])->assertOk()->assertJsonPath('data.tracking_number', 'TH123');
    expect($order->fresh()->status)->toBe(OrderStatus::Shipped);
    adminMove($id, 'completed')->assertOk()->assertJsonPath('data.allowed_next', []);
    expect($order->fresh()->status)->toBe(OrderStatus::Delivered);

    // Points are awarded from the backend-confirmed payment only.
    expect($order->fresh()->points_earned)->toBeGreaterThan(0)->and($v->fresh()->stock_quantity)->toBe(0);
});

it('runs the Myanmar flow through courier, transit and landing', function () {
    enableBankTransfer();
    $user = customer();
    $v = preorderVariant();
    $mm = Address::factory()->create(['user_id' => $user->id, 'country_code' => 'MM', 'region' => 'Yangon']);
    $id = submitPreorder($user, $v, 1, ['address' => $mm])->assertCreated()->assertJsonPath('data.destination', 'myanmar')->json('data.id');

    asAdmin();
    foreach (['in_review', 'approved', 'waiting_payment'] as $s) {
        adminMove($id, $s)->assertOk();
    }
    $this->postJson("/api/admin/v1/preorders/{$id}/mark-paid", ['note' => 'ok'])->assertOk();
    adminMove($id, 'packaging')->assertStatus(409);
    foreach (['waiting_courier', 'in_transit', 'landed_myanmar', 'on_delivery', 'completed'] as $s) {
        adminMove($id, $s)->assertOk()->assertJsonPath('data.status', $s);
    }
    expect(Order::query()->first()->status)->toBe(OrderStatus::Delivered);
});

it('requires a reason to reject and only from review', function () {
    $user = customer();
    $id = submitPreorder($user, preorderVariant(), 1)->assertCreated()->json('data.id');

    asAdmin();
    adminMove($id, 'rejected', ['note' => 'x'])->assertStatus(409);
    adminMove($id, 'in_review')->assertOk();
    adminMove($id, 'rejected')->assertStatus(422);
    adminMove($id, 'rejected', ['note' => 'Supplier out of this colour'])->assertOk();

    Sanctum::actingAs($user, ['customer']);
    $this->getJson("/api/v1/preorders/{$id}")->assertOk()
        ->assertJsonPath('data.status', 'rejected')->assertJsonPath('data.reject_reason', 'Supplier out of this colour')->assertJsonPath('data.can_cancel', false);
});

it('lets the customer pay a waiting_payment pre-order and cancels the payable order with it', function () {
    enableBankTransfer();
    $user = customer();
    $id = submitPreorder($user, preorderVariant(), 1)->assertCreated()->json('data.id');
    $this->postJson("/api/v1/preorders/{$id}/pay", ['payment_method' => 'bank_transfer'])->assertStatus(409)->assertJsonPath('code', 'PREORDER_NOT_AWAITING_PAYMENT');

    asAdmin();
    foreach (['in_review', 'approved', 'waiting_payment'] as $s) {
        adminMove($id, $s)->assertOk();
    }

    Sanctum::actingAs($user, ['customer']);
    $this->postJson("/api/v1/preorders/{$id}/pay", ['payment_method' => 'cod'])->assertStatus(422);
    $this->postJson("/api/v1/preorders/{$id}/pay", ['payment_method' => 'bank_transfer'])->assertOk();
    $this->postJson("/api/v1/preorders/{$id}/cancel")->assertOk()->assertJsonPath('data.status', 'cancelled');

    $order = Order::query()->where('preorder_id', $id)->first();
    expect($order->status)->toBe(OrderStatus::Cancelled)->and(InventoryMovement::query()->count())->toBe(0);
});

it('refunds a paid pre-order without restocking', function () {
    enableBankTransfer();
    $user = customer();
    $v = preorderVariant(stock: 3);
    $id = submitPreorder($user, $v, 1)->assertCreated()->json('data.id');

    asAdmin();
    foreach (['in_review', 'approved', 'waiting_payment'] as $s) {
        adminMove($id, $s)->assertOk();
    }
    $this->postJson("/api/admin/v1/preorders/{$id}/refund", ['note' => 'too early'])->assertStatus(409);
    $this->postJson("/api/admin/v1/preorders/{$id}/mark-paid", ['note' => 'ok'])->assertOk();
    adminMove($id, 'cancelled')->assertStatus(409)->assertJsonPath('code', 'PREORDER_PAID_USE_REFUND');
    $this->postJson("/api/admin/v1/preorders/{$id}/refund", ['note' => 'customer asked'])->assertOk()->assertJsonPath('data.status', 'refunded');

    expect(Order::query()->first()->status)->toBe(OrderStatus::Refunded)->and($v->fresh()->stock_quantity)->toBe(3);
});

it('does not let a customer see or cancel someone elses pre-order', function () {
    $owner = customer();
    $id = submitPreorder($owner, preorderVariant(), 1)->assertCreated()->json('data.id');

    customer();
    $this->getJson("/api/v1/preorders/{$id}")->assertNotFound();
    $this->postJson("/api/v1/preorders/{$id}/cancel")->assertNotFound();
});

it('limits a normal order to the admin min/max per product, across sizes', function () {
    $user = customer();
    $a = variant(stock: 20, productAttributes: ['min_order_qty' => 2, 'max_order_qty' => 4]);
    $b = App\Models\ProductVariant::factory()->create(['product_id' => $a->product_id, 'stock_quantity' => 20]);

    $this->postJson('/api/v1/cart/items', ['variant_id' => $a->id, 'quantity' => 1])->assertCreated();
    $this->getJson('/api/v1/cart')->assertJsonPath('data.issues.0.code', 'below_min_quantity')->assertJsonPath('data.issues.0.min', 2)->assertJsonPath('data.can_checkout', false);

    $this->postJson('/api/v1/cart/items', ['variant_id' => $b->id, 'quantity' => 3])->assertCreated(); // 1 + 3 = 4
    $this->getJson('/api/v1/cart')->assertJsonPath('data.can_checkout', true);
    $this->postJson('/api/v1/cart/items', ['variant_id' => $b->id, 'quantity' => 1])
        ->assertStatus(422)->assertJsonPath('code', 'ORDER_QTY_ABOVE_MAX')->assertJsonPath('errors.max', 4);
});

it('leaves products without limits unrestricted (up to the default line cap)', function () {
    customer();
    $v = variant(stock: 20);
    $this->postJson('/api/v1/cart/items', ['variant_id' => $v->id, 'quantity' => 10])->assertCreated();
    $this->postJson('/api/v1/cart/items', ['variant_id' => $v->id, 'quantity' => 1])->assertStatus(422)->assertJsonPath('code', 'QUANTITY_INVALID');
});

it('saves and validates product limits from the admin API', function () {
    asAdmin();
    $v = variant();
    $this->putJson("/api/admin/v1/products/{$v->product_id}", ['min_order_qty' => 5, 'max_order_qty' => 2])->assertStatus(422);
    $this->putJson("/api/admin/v1/products/{$v->product_id}", [
        'min_order_qty' => 2, 'max_order_qty' => 6, 'preorder_enabled' => true, 'preorder_min_qty' => 1, 'preorder_max_qty' => 3, 'preorder_capacity' => 50,
    ])->assertOk()->assertJsonPath('data.preorder_capacity', 50)->assertJsonPath('data.preorder_enabled', true);
    $this->putJson("/api/admin/v1/products/{$v->product_id}", ['max_order_qty' => null, 'min_order_qty' => null])->assertOk()->assertJsonPath('data.max_order_qty', null);
});
