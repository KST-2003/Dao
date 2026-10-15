<?php

namespace App\Models;

use App\Casts\MediaUrl;
use App\Enums\Currency;
use App\Enums\ProductStatus;
use App\Services\Currency\CurrencyService;
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
        'price_mmk', 'sale_price_mmk', 'member_price_mmk', 'cost', 'weight_grams', 'min_order_qty', 'max_order_qty', 'preorder_enabled', 'preorder_min_qty',
        'preorder_max_qty', 'preorder_capacity', 'status', 'badges', 'is_vip_only', 'vip_min_tier_id', 'video_url',
        'external_url', 'social_platform', 'campaign_code', 'published_at',
    ];

    protected $hidden = ['cost'];

    protected function casts(): array
    {
        return [
            'status' => ProductStatus::class,
            'badges' => 'array',
            'is_vip_only' => 'boolean',
            'preorder_enabled' => 'boolean',
            'min_order_qty' => 'integer',
            'max_order_qty' => 'integer',
            'preorder_min_qty' => 'integer',
            'preorder_max_qty' => 'integer',
            'preorder_capacity' => 'integer',
            'price' => 'integer',
            'sale_price' => 'integer',
            'member_price' => 'integer',
            'price_mmk' => 'integer',
            'sale_price_mmk' => 'integer',
            'member_price_mmk' => 'integer',
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

    /** True when admins priced this product in MMK themselves (otherwise MMK is THB converted at the rate). */
    public function hasOwnMmkPrice(): bool
    {
        return $this->price_mmk !== null;
    }

    /** Regular price in the given currency. */
    public function priceIn(Currency $currency): int
    {
        return match (true) {
            $currency === Currency::THB => $this->price,
            $this->hasOwnMmkPrice() => $this->price_mmk,
            default => app(CurrencyService::class)->fromBase($this->price, $currency),
        };
    }

    /** Sale price in the given currency, only when it is a real discount; null otherwise. */
    public function salePriceIn(Currency $currency): ?int
    {
        $sale = match (true) {
            $currency === Currency::THB => $this->sale_price,
            $this->hasOwnMmkPrice() => $this->sale_price_mmk,
            default => $this->sale_price === null ? null : app(CurrencyService::class)->fromBase($this->sale_price, $currency),
        };

        return ($sale !== null && $sale < $this->priceIn($currency)) ? $sale : null;
    }

    /** DAO member price in the given currency (null = none). */
    public function memberPriceIn(Currency $currency): ?int
    {
        return match (true) {
            $currency === Currency::THB => $this->member_price,
            $this->hasOwnMmkPrice() => $this->member_price_mmk,
            default => $this->member_price === null ? null : app(CurrencyService::class)->fromBase($this->member_price, $currency),
        };
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
