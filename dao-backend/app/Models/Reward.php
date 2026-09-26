<?php

namespace App\Models;

use App\Enums\RewardType;
use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Reward extends Model
{
    use HasTranslations;

    protected $fillable = [
        'code', 'type', 'points_cost', 'value', 'value_type', 'min_subtotal', 'min_tier_id', 'stock',
        'coupon_valid_days', 'image_url', 'is_active', 'starts_at', 'ends_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => RewardType::class,
            'points_cost' => 'integer',
            'value' => 'integer',
            'min_subtotal' => 'integer',
            'stock' => 'integer',
            'is_active' => 'boolean',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function translations(): HasMany
    {
        return $this->hasMany(RewardTranslation::class);
    }

    public function minTier(): BelongsTo
    {
        return $this->belongsTo(MembershipTier::class, 'min_tier_id');
    }

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->where(fn (Builder $q) => $q->whereNull('stock')->orWhere('stock', '>', 0))
            ->where(fn (Builder $q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn (Builder $q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', now()));
    }
}
