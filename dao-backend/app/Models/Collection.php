<?php

namespace App\Models;

use App\Casts\MediaUrl;
use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Collection extends Model
{
    use HasFactory, HasTranslations;

    protected $fillable = ['slug', 'hero_image_url', 'sort_order', 'is_published', 'is_featured', 'is_vip_only', 'starts_at', 'ends_at'];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'is_featured' => 'boolean',
            'is_vip_only' => 'boolean',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'hero_image_url' => MediaUrl::class,
        ];
    }

    public function translations(): HasMany
    {
        return $this->hasMany(CollectionTranslation::class);
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class)->withPivot('sort_order')->orderByPivot('sort_order');
    }

    public function scopeLive(Builder $query): Builder
    {
        return $query->where('is_published', true)
            ->where(fn (Builder $q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn (Builder $q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', now()));
    }
}
