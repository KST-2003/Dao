<?php

namespace App\Models;

use App\Casts\MediaUrl;
use App\Enums\ContentType;
use App\Enums\PublishStatus;
use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/** Reusable creator content: vlog, recipe video, fashion video, tutorial, short. */
class Video extends Model
{
    use HasFactory, HasTranslations, SoftDeletes;

    protected $fillable = [
        'content_type', 'category', 'slug', 'thumbnail_url', 'video_url', 'duration_seconds', 'status',
        'tags', 'is_members_only', 'author_id', 'published_at',
    ];

    protected function casts(): array
    {
        return [
            'content_type' => ContentType::class,
            'status' => PublishStatus::class,
            'tags' => 'array',
            'is_members_only' => 'boolean',
            'view_count' => 'integer',
            'like_count' => 'integer',
            'comment_count' => 'integer',
            'published_at' => 'datetime',
            'thumbnail_url' => MediaUrl::class,
            'video_url' => MediaUrl::class,
        ];
    }

    public function translations(): HasMany
    {
        return $this->hasMany(VideoTranslation::class);
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class)->withPivot(['sort_order', 'timestamp_seconds'])->orderByPivot('sort_order');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'author_id');
    }

    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', PublishStatus::Published->value)->where('published_at', '<=', now());
    }
}
