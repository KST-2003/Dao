<?php

namespace App\Events;

use App\Enums\PreorderStatus;
use App\Models\Preorder;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/** Dispatched only after the surrounding DB transaction commits. */
class PreorderStatusChanged implements ShouldDispatchAfterCommit
{
    use Dispatchable, SerializesModels;

    public function __construct(public Preorder $preorder, public ?PreorderStatus $from, public PreorderStatus $to) {}
}
