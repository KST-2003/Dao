<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Cached balance for fast reads. Source of truth = loyalty_transactions. */
class LoyaltyAccount extends Model
{
    protected $primaryKey = 'user_id';

    public $incrementing = false;

    protected $fillable = ['user_id', 'balance', 'lifetime_points'];

    protected function casts(): array
    {
        return ['balance' => 'integer', 'lifetime_points' => 'integer'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
