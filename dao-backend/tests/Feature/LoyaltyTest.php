<?php

use App\Enums\LoyaltyTransactionType as Type;
use App\Models\AdminUser;
use App\Models\AppNotification;
use App\Models\LoyaltyAccount;
use App\Models\LoyaltyTransaction;
use App\Models\MembershipHistory;
use App\Models\Order;
use App\Models\User;
use App\Services\Loyalty\LoyaltyService;
use App\Services\Loyalty\MembershipService;
use App\Services\Orders\OrderService;

function balanceOf(User $user): int
{
    return (int) LoyaltyAccount::query()->find($user->id)?->balance;
}

function paidOrderFor(User $user, int $price = 59000, array $overrides = []): Order
{
    $v = variant(price: $price, stock: 10);
    test()->postJson('/api/v1/cart/items', ['variant_id' => $v->id, 'quantity' => 1])->assertCreated();
    $id = placeOrder($user, $overrides)->assertCreated()->json('data.order.id');
    $order = Order::query()->findOrFail($id);
    app(OrderService::class)->markPaid($order, AdminUser::factory()->create());

    return $order->fresh();
}

it('awards points only after payment is confirmed, exactly once', function () {
    $user = customer();
    $v = variant(price: 59000);
    $this->postJson('/api/v1/cart/items', ['variant_id' => $v->id, 'quantity' => 1]);
    $order = Order::query()->findOrFail(placeOrder($user)->json('data.order.id'));

    expect(balanceOf($user))->toBe(0); // placed but not paid

    $admin = AdminUser::factory()->create();
    app(OrderService::class)->markPaid($order, $admin);
    app(OrderService::class)->markPaid($order->fresh(), $admin); // duplicate webhook / double click

    expect(balanceOf($user))->toBe(5)
        ->and(LoyaltyTransaction::query()->where('type', Type::PurchaseEarned->value)->count())->toBe(1)
        ->and($order->fresh()->points_earned)->toBe(5)
        ->and($user->membership->fresh()->lifetime_spend)->toBe(59000)
        ->and(AppNotification::query()->where('user_id', $user->id)->where('type', 'points_earned')->exists())->toBeTrue();
});

it('redeems points as a discount within the configured rules', function () {
    $user = customer();
    app(LoyaltyService::class)->credit($user, Type::CampaignBonus, 1000, null, 'test');
    $v = variant(price: 59000);
    $this->postJson('/api/v1/cart/items', ['variant_id' => $v->id, 'quantity' => 1]);

    // 100 points = ฿10 → 300 points = ฿30 (3000 satang)
    $this->postJson('/api/v1/checkout/quote', ['points' => 300])->assertOk()
        ->assertJsonPath('data.points_discount', 3000)
        ->assertJsonPath('data.total', 64000 - 3000);

    $this->postJson('/api/v1/checkout/quote', ['points' => 50])->assertStatus(422)->assertJsonPath('code', 'POINTS_BELOW_MINIMUM');
    $this->postJson('/api/v1/checkout/quote', ['points' => 150])->assertStatus(422)->assertJsonPath('code', 'POINTS_INVALID_STEP');
    $this->postJson('/api/v1/checkout/quote', ['points' => 2000])->assertStatus(422)->assertJsonPath('code', 'POINTS_INSUFFICIENT');

    placeOrder($user, ['points_to_redeem' => 300])->assertCreated()->assertJsonPath('data.order.points_discount', 3000);
    expect(balanceOf($user))->toBe(700);
});

it('reverses earned points and returns redeemed points on refund, keeping the ledger auditable', function () {
    $user = customer();
    app(LoyaltyService::class)->credit($user, Type::CampaignBonus, 200, null, 'test');
    $order = paidOrderFor($user, 59000, ['points_to_redeem' => 200]);
    // 200 redeemed; goods total 59000-2000 = 57000 → 5 points earned
    expect(balanceOf($user))->toBe(5);

    $this->travel(1)->minutes();
    app(OrderService::class)->refund($order, AdminUser::factory()->create(), true, 'Customer return');

    $types = LoyaltyTransaction::query()->where('user_id', $user->id)->orderBy('id')->pluck('type')->map->value->all();
    expect($types)->toBe(['campaign_bonus', 'redeemed', 'purchase_earned', 'refund_reversal', 'redemption_reversal'])
        ->and(balanceOf($user))->toBe(200)
        ->and((int) LoyaltyTransaction::query()->where('user_id', $user->id)->sum('points'))->toBe(200)
        ->and(app(LoyaltyService::class)->reconcile())->toBe([])
        ->and($user->membership->fresh()->lifetime_spend)->toBe(0);
});

it('upgrades membership when lifetime points reach the next tier and notifies the member', function () {
    $user = customer();
    app(LoyaltyService::class)->credit($user, Type::CampaignBonus, 5000, null, 'Launch campaign');
    $tier = app(MembershipService::class)->recalculate($user, 'test');

    expect($tier->code)->toBe('vip')
        ->and(MembershipHistory::query()->where('user_id', $user->id)->count())->toBe(1)
        ->and(AppNotification::query()->where('user_id', $user->id)->where('type', 'tier_upgrade')->exists())->toBeTrue();

    $this->getJson('/api/v1/me/membership')->assertOk()
        ->assertJsonPath('data.tier.code', 'vip')
        ->assertJsonPath('data.next_tier.code', 'dao_star')
        ->assertJsonPath('data.points_to_next', 15000);
});

it('expires unspent points FIFO and records an expired transaction', function () {
    $user = customer();
    $loyalty = app(LoyaltyService::class);
    $loyalty->credit($user, Type::CampaignBonus, 300, null, 'old');
    $this->travel(6)->months();
    $loyalty->credit($user, Type::CampaignBonus, 200, null, 'new');
    $loyalty->debit($user, Type::Redeemed, 100, null, 'spend'); // consumes the oldest lot first

    $this->travel(7)->months(); // first lot (12-month expiry) is now past due, second is not
    $loyalty->expireDueLots();

    expect(balanceOf($user))->toBe(200)
        ->and(LoyaltyTransaction::query()->where('type', 'expired')->value('points'))->toBe(-200)
        ->and($loyalty->reconcile())->toBe([]);
});

it('requires a reason for manual adjustments and audits them', function () {
    $user = User::factory()->create();
    $admin = AdminUser::factory()->create();
    Laravel\Sanctum\Sanctum::actingAs($admin, ['admin']);

    $this->postJson('/api/admin/v1/points/adjust', ['user_id' => $user->id, 'points' => 50])->assertStatus(422);
    $this->postJson('/api/admin/v1/points/adjust', ['user_id' => $user->id, 'points' => 50, 'reason' => 'Goodwill for late delivery'])->assertCreated();

    $tx = LoyaltyTransaction::query()->where('user_id', $user->id)->firstOrFail();
    expect($tx->admin_user_id)->toBe($admin->id)
        ->and($tx->description)->toBe('Goodwill for late delivery')
        ->and(App\Models\AuditLog::query()->where('action', 'points.adjusted')->exists())->toBeTrue();
});
