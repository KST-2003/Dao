<?php

namespace App\Listeners;

use App\Events\OrderRefunded;
use App\Models\Order;
use App\Services\Loyalty\LoyaltyService;
use App\Services\Loyalty\MembershipService;

/** Refund: reverse earned points (refund_reversal), return spent points, remove spend, re-evaluate tier. */
class ReverseLoyaltyOnRefund
{
    public function __construct(
        private readonly LoyaltyService $loyalty,
        private readonly MembershipService $membership,
    ) {}

    public function handle(OrderRefunded $event): void
    {
        $order = $event->order->fresh();
        $this->loyalty->reverseForRefund($order);
        $this->loyalty->returnRedeemedPoints($order);
        $released = Order::query()->whereKey($order->id)->whereNotNull('spend_recorded_at')->update(['spend_recorded_at' => null]);
        if ($released === 1) {
            $this->membership->removeSpend($order->user, $order->eligibleSpend());
        }
        $this->membership->recalculate($order->user, 'order_refunded:'.$order->order_number);
    }
}
