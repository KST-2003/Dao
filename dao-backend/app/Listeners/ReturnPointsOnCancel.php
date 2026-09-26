<?php

namespace App\Listeners;

use App\Events\OrderCancelled;
use App\Services\Loyalty\LoyaltyService;

class ReturnPointsOnCancel
{
    public function __construct(private readonly LoyaltyService $loyalty) {}

    public function handle(OrderCancelled $event): void
    {
        $this->loyalty->returnRedeemedPoints($event->order);
    }
}
