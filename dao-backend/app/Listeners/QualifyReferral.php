<?php

namespace App\Listeners;

use App\Events\OrderPaid;
use App\Services\Loyalty\ReferralService;

class QualifyReferral
{
    public function __construct(private readonly ReferralService $referrals) {}

    public function handle(OrderPaid $event): void
    {
        $this->referrals->qualifyOnPaidOrder($event->order);
    }
}
