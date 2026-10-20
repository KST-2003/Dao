<?php

namespace App\Models;

use App\Casts\MediaUrl;
use App\Enums\CommentStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Comment extends Model
{
    use SoftDeletes;

    protected $fillable = ['user_id', 'parent_id', 'reply_to_user_id', 'body', 'image_url'];

    protected function casts(): array
    {
        return [
            'status' => CommentStatus::class,
            'image_url' => MediaUrl::class,
            'like_count' => 'integer',
            'reply_count' => 'integer',
            'moderated_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function replyToUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reply_to_user_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function moderator(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'moderated_by');
    }

    public function commentable(): MorphTo
    {
        return $this->morphTo();
    }

    public function isBanned(): bool
    {
        return $this->status === CommentStatus::Banned;
    }

    /** What a viewer may see: everything visible, plus their own banned comments (shown as "banned"). */
    public function scopeVisibleTo(Builder $query, ?User $viewer): Builder
    {
        return $query->where(function (Builder $q) use ($viewer) {
            $q->where('status', CommentStatus::Visible->value);
            if ($viewer) {
                $q->orWhere('user_id', $viewer->id);
            }
        });
    }
}
