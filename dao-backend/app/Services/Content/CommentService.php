<?php

namespace App\Services\Content;

use App\Enums\CommentStatus;
use App\Exceptions\DomainException;
use App\Models\AdminUser;
use App\Models\Comment;
use App\Models\Like;
use App\Models\User;
use App\Models\Video;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

/**
 * Video comments: one level of replies (a reply to a reply attaches to the same top-level comment),
 * likes, an optional image, and admin moderation. A banned comment stays visible to its author only;
 * a deleted one is gone for everyone. `videos.comment_count` always counts what the public can see.
 */
class CommentService
{
    public function __construct(private readonly EngagementService $engagement) {}

    public function post(User $user, Video $video, ?string $body, ?string $imageKey, ?int $parentId): Comment
    {
        $body = trim(strip_tags((string) $body));
        if ($body === '' && ! $imageKey) {
            throw DomainException::of('COMMENT_EMPTY', 422);
        }

        return DB::transaction(function () use ($user, $video, $body, $imageKey, $parentId) {
            $root = null;
            $replyTo = null;
            if ($parentId !== null) {
                $target = $video->comments()->visibleTo($user)->findOrFail($parentId);
                $root = $target->parent_id ? $video->comments()->visibleTo($user)->findOrFail($target->parent_id) : $target;
                $replyTo = $target->user_id !== $user->id ? $target->user_id : null;
            }

            $comment = $video->comments()->create([
                'user_id' => $user->id, 'parent_id' => $root?->id, 'reply_to_user_id' => $replyTo,
                'body' => $body === '' ? null : $body, 'image_url' => $imageKey,
            ]);
            $this->recount($video, $root);

            return $comment->refresh(); // pick up DB defaults (status, counters)
        });
    }

    /** Top-level comments, newest first. */
    public function topLevel(Video $video, ?User $viewer): LengthAwarePaginator
    {
        return $video->comments()->whereNull('parent_id')->visibleTo($viewer)->with(['user', 'replyToUser'])->latest('id')->paginate(20);
    }

    /** Replies under one top-level comment, oldest first. */
    public function replies(Comment $root, ?User $viewer): LengthAwarePaginator
    {
        return Comment::query()->where('parent_id', $root->id)->visibleTo($viewer)->with(['user', 'replyToUser'])->orderBy('id')->paginate(20);
    }

    /** @return list<int> */
    public function likedIds(?User $user, array $commentIds): array
    {
        if ($user === null || $commentIds === []) {
            return [];
        }

        return Like::query()->where('user_id', $user->id)->where('likeable_type', (new Comment)->getMorphClass())
            ->whereIn('likeable_id', $commentIds)->pluck('likeable_id')->all();
    }

    /** The author removes their own comment (and its replies). */
    public function deleteOwn(User $user, Comment $comment): void
    {
        if ($comment->user_id !== $user->id) {
            throw DomainException::of('FORBIDDEN', 403);
        }
        $this->delete($comment);
    }

    public function ban(Comment $comment, AdminUser $admin, ?string $reason): Comment
    {
        return $this->setStatus($comment, CommentStatus::Banned, $admin, $reason);
    }

    public function unban(Comment $comment, AdminUser $admin): Comment
    {
        return $this->setStatus($comment, CommentStatus::Visible, $admin, null);
    }

    public function delete(Comment $comment): void
    {
        DB::transaction(function () use ($comment) {
            $video = $comment->commentable;
            $root = $comment->parent_id ? $comment->parent : null;
            Comment::query()->where('parent_id', $comment->id)->get()->each->delete();
            $comment->delete();
            $this->recount($video, $root);
        });
    }

    private function setStatus(Comment $comment, CommentStatus $status, AdminUser $admin, ?string $reason): Comment
    {
        return DB::transaction(function () use ($comment, $status, $admin, $reason) {
            $comment->forceFill([
                'status' => $status, 'banned_reason' => $status === CommentStatus::Banned ? $reason : null,
                'moderated_by' => $admin->id, 'moderated_at' => now(),
            ])->save();
            $this->recount($comment->commentable, $comment->parent_id ? $comment->parent : null);

            return $comment;
        });
    }

    /**
     * Recomputes the counters from the rows instead of incrementing, so ban/unban/delete can never drift them.
     * Replies under a banned or deleted top-level comment are unreachable, so they aren't counted.
     */
    private function recount(?Video $video, ?Comment $root): void
    {
        if ($root) {
            $root->forceFill(['reply_count' => Comment::query()->where('parent_id', $root->id)->where('status', CommentStatus::Visible->value)->count()])->save();
        }
        if ($video === null) {
            return; // the video itself was deleted
        }
        $video->forceFill(['comment_count' => $video->comments()->where('status', CommentStatus::Visible->value)
            ->where(fn ($q) => $q->whereNull('parent_id')->orWhereHas('parent', fn ($p) => $p->where('status', CommentStatus::Visible->value)))
            ->count()])->save();
    }
}
