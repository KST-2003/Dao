<?php

namespace App\Events;

use App\Models\LoyaltyTransaction;
use App\Models\User;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/** Dispatched only after the surrounding DB transaction commits. */
class PointsEarned implements ShouldDispatchAfterCommit
{
    use Dispatchable, SerializesModels;

    public function __construct(public User $user, public LoyaltyTransaction $transaction) {}
}
