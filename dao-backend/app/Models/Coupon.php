<?php

namespace App\Models;

use App\Enums\CouponScope;
use App\Enums\CouponType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property CouponType $type
 * @property CouponScope $scope
 * @property int $value
 */
class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code', 'type', 'value', 'max_discount', 'min_subtotal', 'scope', 'min_tier_id', 'user_id',
        'usage_limit', 'usage_limit_per_user', 'description', 'is_active', 'starts_at', 'ends_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => CouponType::class,
            'scope' => CouponScope::class,
            'value' => 'integer',
            'max_discount' => 'integer',
            'min_subtotal' => 'integer',
            'usage_limit' => 'integer',
            'usage_limit_per_user' => 'integer',
            'used_count' => 'integer',
            'is_active' => 'boolean',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    protected function code(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(set: fn (string $v) => strtoupper(trim($v)));
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class);
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class);
    }

    public function minTier(): BelongsTo
    {
        return $this->belongsTo(MembershipTier::class, 'min_tier_id');
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(CouponRedemption::class);
    }
}
