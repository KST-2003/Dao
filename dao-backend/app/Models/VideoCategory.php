<?php

namespace App\Models;

use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A tab in the video feed. Videos reference it by `slug` (videos.category). */
class VideoCategory extends Model
{
    use HasTranslations;

    protected $fillable = ['slug', 'sort_order', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean', 'sort_order' => 'integer'];
    }

    public function translations(): HasMany
    {
        return $this->hasMany(VideoCategoryTranslation::class);
    }

    public function videos(): HasMany
    {
        return $this->hasMany(Video::class, 'category', 'slug');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
