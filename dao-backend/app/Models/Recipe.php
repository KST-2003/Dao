<?php

namespace App\Models;

use App\Enums\Difficulty;
use App\Enums\PublishStatus;
use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Recipe extends Model
{
    use HasFactory, HasTranslations, SoftDeletes;

    protected $fillable = [
        'video_id', 'slug', 'category', 'cover_image_url', 'prep_minutes', 'cook_minutes', 'servings',
        'difficulty', 'spice_level', 'is_featured', 'status', 'published_at',
    ];

    protected function casts(): array
    {
        return [
            'difficulty' => Difficulty::class,
            'status' => PublishStatus::class,
            'is_featured' => 'boolean',
            'spice_level' => 'integer',
            'published_at' => 'datetime',
        ];
    }

    public function translations(): HasMany
    {
        return $this->hasMany(RecipeTranslation::class);
    }

    public function ingredients(): HasMany
    {
        return $this->hasMany(RecipeIngredient::class)->orderBy('sort_order');
    }

    public function steps(): HasMany
    {
        return $this->hasMany(RecipeStep::class)->orderBy('step_number');
    }

    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', PublishStatus::Published->value)->where('published_at', '<=', now());
    }
}
