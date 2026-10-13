<?php

namespace App\Listeners;

use App\Events\OrderPaid;
use App\Services\Orders\PreorderService;

/** A pre-order's payable order was paid (webhook or staff confirmation) → start processing. */
class AdvancePreorderOnPaid
{
    public function __construct(private readonly PreorderService $preorders) {}

    public function handle(OrderPaid $event): void
    {
        $this->preorders->handleOrderPaid($event->order);
    }
}
