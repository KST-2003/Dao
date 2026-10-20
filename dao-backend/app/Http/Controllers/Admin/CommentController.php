<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CommentStatus;
use App\Http\Requests\Admin\ModerateCommentRequest;
use App\Models\Comment;
use App\Services\Content\CommentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Moderation queue for video comments: ban (author still sees it as banned), unban, delete. */
class CommentController extends AdminController
{
    public function index(Request $request): JsonResponse
    {
        $query = Comment::query()->with(['user:id,name,display_name,avatar_url', 'commentable', 'parent:id,user_id'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', (string) $request->input('status')))
            ->when($request->filled('video_id'), fn ($q) => $q->where('commentable_type', 'video')->where('commentable_id', $request->integer('video_id')))
            ->when($request->boolean('with_image'), fn ($q) => $q->whereNotNull('image_url'))
            ->when($request->filled('q'), fn ($q) => $q->where(function ($q) use ($request) {
                $like = $this->like((string) $request->input('q'));
                $q->where('body', 'like', $like)->orWhereHas('user', fn ($u) => $u->where('name', 'like', $like)->orWhere('display_name', 'like', $like));
            }))
            ->latest('id');

        return $this->paginated($query->paginate($this->perPage()), fn (Comment $c) => [
            'id' => $c->id,
            'video' => ['id' => $c->commentable_id, 'title' => $c->commentable?->translated('title')],
            'user' => ['id' => $c->user_id, 'name' => $c->user?->display_name ?: $c->user?->name, 'avatar_url' => $c->user?->avatar_url],
            'body' => $c->body,
            'image_url' => $c->image_url,
            'is_reply' => $c->parent_id !== null,
            'like_count' => $c->like_count,
            'reply_count' => $c->reply_count,
            'status' => $c->status->value,
            'banned_reason' => $c->banned_reason,
            'created_at' => $c->created_at?->toIso8601String(),
        ]);
    }

    public function ban(ModerateCommentRequest $request, int $id, CommentService $comments): JsonResponse
    {
        $comment = $comments->ban(Comment::query()->findOrFail($id), $this->admin(), $request->input('reason'));
        $this->audit('comment.banned', $comment, ['status' => CommentStatus::Banned->value], $request->input('reason'));

        return $this->ok(['id' => $comment->id, 'status' => $comment->status->value]);
    }

    public function unban(int $id, CommentService $comments): JsonResponse
    {
        $comment = $comments->unban(Comment::query()->findOrFail($id), $this->admin());
        $this->audit('comment.unbanned', $comment, ['status' => CommentStatus::Visible->value]);

        return $this->ok(['id' => $comment->id, 'status' => $comment->status->value]);
    }

    public function destroy(int $id, CommentService $comments): JsonResponse
    {
        $comment = Comment::query()->findOrFail($id);
        $comments->delete($comment);
        $this->audit('comment.deleted', $comment, ['body' => mb_substr((string) $comment->body, 0, 200)]);

        return $this->ok(['deleted' => true]);
    }
}
