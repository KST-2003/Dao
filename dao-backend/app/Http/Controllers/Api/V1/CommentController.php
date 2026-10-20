<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\MediaStorageInterface;
use App\Enums\CommentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\CommentImagePresignRequest;
use App\Http\Resources\Api\CommentResource;
use App\Models\Comment;
use App\Services\Content\CommentService;
use App\Services\Content\EngagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Actions on one comment: its replies, likes, delete, and the image upload for new comments. */
class CommentController extends Controller
{
    public function __construct(private readonly CommentService $comments, private readonly EngagementService $engagement) {}

    public function replies(Request $request, int $id): AnonymousResourceCollection
    {
        $user = $request->user('sanctum');
        $root = Comment::query()->whereNull('parent_id')->visibleTo($user)->findOrFail($id);
        $page = $this->comments->replies($root, $user);
        $request->attributes->set('comment_liked_ids', $this->comments->likedIds($user, $page->pluck('id')->all()));

        return CommentResource::collection($page);
    }

    public function like(Request $request, int $id): JsonResponse
    {
        $comment = Comment::query()->where('status', CommentStatus::Visible->value)->findOrFail($id);

        return $this->ok(['liked' => true, 'like_count' => $this->engagement->like($request->user(), $comment)]);
    }

    public function unlike(Request $request, int $id): JsonResponse
    {
        $comment = Comment::query()->findOrFail($id);

        return $this->ok(['liked' => false, 'like_count' => $this->engagement->unlike($request->user(), $comment)]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->comments->deleteOwn($request->user(), Comment::query()->findOrFail($id));

        return $this->ok(['deleted' => true]);
    }

    /** Content type must match exactly what the client then PUTs with — see MediaStorageInterface. */
    public function presignImage(CommentImagePresignRequest $request, MediaStorageInterface $media): JsonResponse
    {
        $contentType = (string) $request->input('content_type');
        $key = $media->makeKey('comments', $request->user()->id, ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$contentType]);

        return $this->ok(['upload_url' => $media->createUploadUrl($key, $contentType), 'key' => $key]);
    }
}
