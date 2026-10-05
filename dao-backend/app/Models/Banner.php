<?php

namespace App\Models;

use App\Casts\MediaUrl;
use App\Enums\BannerPlacement;
use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Banner extends Model
{
    use HasTranslations;

    protected $fillable = ['placement', 'image_url', 'link_type', 'link_value', 'theme', 'sort_order', 'is_active', 'starts_at', 'ends_at'];

    protected function casts(): array
    {
        return ['placement' => BannerPlacement::class, 'is_active' => 'boolean', 'starts_at' => 'datetime', 'ends_at' => 'datetime', 'image_url' => MediaUrl::class];
    }

    public function translations(): HasMany
    {
        return $this->hasMany(BannerTranslation::class);
    }

    public function scopeLive(Builder $query, BannerPlacement $placement): Builder
    {
        return $query->where('placement', $placement->value)->where('is_active', true)
            ->where(fn (Builder $q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn (Builder $q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
            ->orderBy('sort_order');
    }
}
