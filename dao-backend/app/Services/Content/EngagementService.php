<?php

namespace App\Services\Content;

use App\Enums\SaveableType;
use App\Models\Comment;
use App\Models\Like;
use App\Models\SavedItem;
use App\Models\User;
use App\Models\Video;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/** Likes, saves (wishlist), comments and view counting for any content. */
class EngagementService
{
    public function like(User $user, Model $likeable): int
    {
        return DB::transaction(function () use ($user, $likeable) {
            $like = Like::query()->firstOrCreate([
                'user_id' => $user->id, 'likeable_type' => $likeable->getMorphClass(), 'likeable_id' => $likeable->getKey(),
            ]);
            if ($like->wasRecentlyCreated) {
                $likeable->increment('like_count');
            }

            return (int) $likeable->fresh()->like_count;
        });
    }

    public function unlike(User $user, Model $likeable): int
    {
        return DB::transaction(function () use ($user, $likeable) {
            $deleted = Like::query()->where([
                'user_id' => $user->id, 'likeable_type' => $likeable->getMorphClass(), 'likeable_id' => $likeable->getKey(),
            ])->delete();
            if ($deleted && $likeable->like_count > 0) {
                $likeable->decrement('like_count');
            }

            return (int) $likeable->fresh()->like_count;
        });
    }

    public function isLiked(?User $user, Model $likeable): bool
    {
        return $user !== null && Like::query()->where([
            'user_id' => $user->id, 'likeable_type' => $likeable->getMorphClass(), 'likeable_id' => $likeable->getKey(),
        ])->exists();
    }

    public function save(User $user, SaveableType $type, int $id): void
    {
        $type->modelClass()::query()->findOrFail($id);
        SavedItem::query()->firstOrCreate(['user_id' => $user->id, 'saveable_type' => $type, 'saveable_id' => $id]);
    }

    public function unsave(User $user, SaveableType $type, int $id): void
    {
        SavedItem::query()->where(['user_id' => $user->id, 'saveable_type' => $type->value, 'saveable_id' => $id])->delete();
    }

    /** @return list<int> */
    public function savedIds(?User $user, SaveableType $type): array
    {
        if (! $user) {
            return [];
        }

        return SavedItem::query()->where('user_id', $user->id)->where('saveable_type', $type->value)->pluck('saveable_id')->all();
    }

    public function comment(User $user, Video $video, string $body, ?int $parentId): Comment
    {
        return DB::transaction(function () use ($user, $video, $body, $parentId) {
            if ($parentId !== null) {
                $video->comments()->findOrFail($parentId);
            }
            $comment = $video->comments()->create(['user_id' => $user->id, 'parent_id' => $parentId, 'body' => strip_tags($body)]);
            $video->increment('comment_count');

            return $comment;
        });
    }

    /** Counts at most one view per viewer per video per 30 minutes. */
    public function recordView(Video $video, string $viewerKey): void
    {
        if (Cache::add("video_view:{$video->id}:{$viewerKey}", 1, now()->addMinutes(30))) {
            $video->increment('view_count');
        }
    }
}
