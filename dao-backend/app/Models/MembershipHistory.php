<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MembershipHistory extends Model
{
    public const UPDATED_AT = null;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    public function fromTier(): BelongsTo
    {
        return $this->belongsTo(MembershipTier::class, 'from_tier_id');
    }

    public function toTier(): BelongsTo
    {
        return $this->belongsTo(MembershipTier::class, 'to_tier_id');
    }
}
