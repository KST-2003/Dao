<?php

namespace App\Models;

use App\Casts\MediaUrl;
use App\Enums\ProductStatus;
use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $price
 * @property int|null $sale_price
 * @property int|null $member_price
 * @property ProductStatus $status
 */
class Product extends Model
{
    use HasFactory, HasTranslations, SoftDeletes;

    protected $fillable = [
        'category_id', 'slug', 'brand', 'sku', 'barcode', 'currency', 'price', 'sale_price', 'member_price',
        'cost', 'weight_grams', 'status', 'badges', 'is_vip_only', 'vip_min_tier_id', 'video_url',
        'external_url', 'social_platform', 'campaign_code', 'published_at',
    ];

    protected $hidden = ['cost'];

    protected function casts(): array
    {
        return [
            'status' => ProductStatus::class,
            'badges' => 'array',
            'is_vip_only' => 'boolean',
            'price' => 'integer',
            'sale_price' => 'integer',
            'member_price' => 'integer',
            'cost' => 'integer',
            'rating_avg' => 'float',
            'published_at' => 'datetime',
            'video_url' => MediaUrl::class,
        ];
    }

    public function translations(): HasMany
    {
        return $this->hasMany(ProductTranslation::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->orderBy('sort_order');
    }

    public function collections(): BelongsToMany
    {
        return $this->belongsToMany(Collection::class)->withPivot('sort_order');
    }

    public function videos(): BelongsToMany
    {
        return $this->belongsToMany(Video::class)->withPivot(['sort_order', 'timestamp_seconds']);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function vipMinTier(): BelongsTo
    {
        return $this->belongsTo(MembershipTier::class, 'vip_min_tier_id');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', ProductStatus::Published->value)
            ->where(fn (Builder $q) => $q->whereNull('published_at')->orWhere('published_at', '<=', now()));
    }

    public function isPublished(): bool
    {
        return $this->status === ProductStatus::Published
            && ($this->published_at === null || $this->published_at->lte(now()));
    }

    /**
     * The raw storage key, not a resolved URL — this feeds order_items.image_url, a
     * permanent snapshot, so it must never be a presigned URL that later expires.
     */
    public function coverImageUrl(): ?string
    {
        $images = $this->relationLoaded('images') ? $this->images : $this->images()->get();

        return $images->first()?->getRawOriginal('url');
    }
}
