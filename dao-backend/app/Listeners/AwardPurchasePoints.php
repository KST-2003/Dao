<?php

namespace App\Listeners;

use App\Events\OrderPaid;
use App\Models\MembershipTier;
use App\Models\Order;
use App\Services\Loyalty\LoyaltyService;
use App\Services\Loyalty\MembershipService;

/**
 * Payment confirmed → earn points (tier multiplier of the tier at order time) → add spend →
 * re-evaluate tier. Idempotent: points use an idempotency key; spend is claimed once via orders.spend_recorded_at.
 */
class AwardPurchasePoints
{
    public function __construct(
        private readonly LoyaltyService $loyalty,
        private readonly MembershipService $membership,
    ) {}

    public function handle(OrderPaid $event): void
    {
        $order = $event->order->fresh();
        $tier = $order->membership_tier_id ? MembershipTier::query()->find($order->membership_tier_id) : $this->membership->currentTier($order->user);

        $this->loyalty->awardPurchase($order, $tier);

        // Atomic "claim": only the first handler run for this order records the spend.
        $claimed = Order::query()->whereKey($order->id)->whereNull('spend_recorded_at')->update(['spend_recorded_at' => now()]);
        if ($claimed === 1) {
            $this->membership->addSpend($order->user, $order->eligibleSpend());
        }
        $this->membership->recalculate($order->user, 'order_paid:'.$order->order_number);
    }
}
