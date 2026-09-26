<?php

namespace App\Models;

use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Admin-configurable tier (e.g. MEMBER / VIP / DAO STAR). Business logic never refers to tier names.
 *
 * @property int $min_points
 * @property int $min_spend
 */
class MembershipTier extends Model
{
    use HasFactory, HasTranslations;

    protected $fillable = [
        'code', 'sort_order', 'min_points', 'min_spend', 'discount_percent', 'points_multiplier',
        'free_shipping', 'early_access', 'priority_support', 'badge_icon', 'color', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'min_points' => 'integer',
            'min_spend' => 'integer',
            'discount_percent' => 'decimal:2',
            'points_multiplier' => 'decimal:2',
            'free_shipping' => 'boolean',
            'early_access' => 'boolean',
            'priority_support' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function translations(): HasMany
    {
        return $this->hasMany(MembershipTierTranslation::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /** A tier with no thresholds is the entry tier everyone gets. Otherwise reaching EITHER threshold qualifies. */
    public function isQualifiedBy(int $lifetimePoints, int $lifetimeSpend): bool
    {
        if ($this->min_points === 0 && $this->min_spend === 0) {
            return true;
        }

        return ($this->min_points > 0 && $lifetimePoints >= $this->min_points)
            || ($this->min_spend > 0 && $lifetimeSpend >= $this->min_spend);
    }
}
