<?php

namespace App\Events;

use App\Models\MembershipTier;
use App\Models\User;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/** Dispatched only after the surrounding DB transaction commits. */
class MembershipTierChanged implements ShouldDispatchAfterCommit
{
    use Dispatchable, SerializesModels;

    public function __construct(public User $user, public ?MembershipTier $from, public MembershipTier $to, public bool $isUpgrade) {}
}
