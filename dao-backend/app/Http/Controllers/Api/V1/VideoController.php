<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ContentType;
use App\Enums\SaveableType;
use App\Exceptions\DomainException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\CommentRequest;
use App\Http\Resources\Api\CommentResource;
use App\Http\Resources\Api\VideoCardResource;
use App\Http\Resources\Api\VideoResource;
use App\Models\Video;
use App\Services\Content\ContentAccessService;
use App\Services\Content\EngagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/** One controller for all creator content (vlog, fashion, tutorial, short, recipe video). */
class VideoController extends Controller
{
    public function __construct(private readonly EngagementService $engagement, private readonly ContentAccessService $contentAccess) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $data = $request->validate([
            'type' => ['nullable', Rule::enum(ContentType::class)],
            'category' => ['nullable', 'string', 'max:40'],
            'tags' => ['nullable', 'array'], 'tags.*' => ['string', 'max:40'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:30'],
        ]);
        $request->attributes->set('saved_video_ids', $this->engagement->savedIds($request->user('sanctum'), SaveableType::Video));

        $videos = Video::query()->published()->with('translations')
            ->when($data['type'] ?? null, fn ($q, $t) => $q->where('content_type', $t))
            ->when($data['category'] ?? null, fn ($q, $c) => $q->where('category', $c))
            ->when($data['tags'] ?? null, fn ($q, $tags) => $q->where(function ($q) use ($tags) {
                foreach ($tags as $tag) {
                    $q->orWhereJsonContains('tags', mb_strtolower($tag));
                }
            }))
            ->latest('published_at')->paginate($data['per_page'] ?? 12);

        return VideoCardResource::collection($videos);
    }

    public function show(Request $request, int $id): VideoResource
    {
        $video = Video::query()->published()->with(['translations', 'products' => fn ($q) => $q->published()->with(['translations', 'images', 'variants'])])->findOrFail($id);
        $user = $request->user('sanctum');
        $request->attributes->set('saved_video_ids', $this->engagement->savedIds($user, SaveableType::Video));
        $request->attributes->set('saved_product_ids', $this->engagement->savedIds($user, SaveableType::Product));
        $request->attributes->set('video_is_liked', $this->engagement->isLiked($user, $video));

        return new VideoResource($video);
    }

    /**
     * Same content_type, ranked by tag overlap (most shared tags first, ties broken by recency).
     * Scored in PHP over a modest candidate pool rather than in SQL — tags is a JSON array, and
     * portable cross-database set-intersection isn't worth it at this scale.
     */
    public function related(int $id): AnonymousResourceCollection
    {
        $video = Video::query()->published()->findOrFail($id);
        $tags = $video->tags ?? [];

        $candidates = Video::query()->published()->whereKeyNot($video->id)
            ->where('content_type', $video->content_type->value)
            ->with('translations')->latest('published_at')->limit(40)->get();

        $ranked = $candidates
            ->sortByDesc(fn (Video $v) => $tags && $v->tags ? count(array_intersect($tags, $v->tags)) : 0)
            ->values()->take(8);

        return VideoCardResource::collection($ranked);
    }

    public function view(Request $request, int $id): JsonResponse
    {
        $video = Video::query()->published()->findOrFail($id);
        $this->engagement->recordView($video, (string) ($request->user('sanctum')?->id ?? sha1((string) $request->ip())));

        return $this->ok(['counted' => true]);
    }

    public function like(Request $request, int $id): JsonResponse
    {
        return $this->ok(['liked' => true, 'like_count' => $this->engagement->like($request->user(), Video::query()->published()->findOrFail($id))]);
    }

    public function unlike(Request $request, int $id): JsonResponse
    {
        return $this->ok(['liked' => false, 'like_count' => $this->engagement->unlike($request->user(), Video::query()->published()->findOrFail($id))]);
    }

    public function comments(int $id): AnonymousResourceCollection
    {
        $video = Video::query()->published()->findOrFail($id);

        return CommentResource::collection($video->comments()->where('is_hidden', false)->with('user')->latest()->paginate(20));
    }

    public function comment(CommentRequest $request, int $id): CommentResource
    {
        $video = Video::query()->published()->findOrFail($id);

        return new CommentResource($this->engagement->comment($request->user(), $video, (string) $request->input('body'), $request->integer('parent_id') ?: null)->load('user'));
    }

    /**
     * Gated by tier/user override (ContentAccessService), not just hidden in the app —
     * a non-privileged request is rejected here regardless of what the client sends.
     *
     * One honest limit: this only guards the *sanctioned* download action. If the storage
     * bucket is public (R2_PUBLIC_URL set — see MediaStorageInterface::getMediaUrl), the same
     * URL is already in every /videos/{id} response for playback, so a determined user could
     * still fetch the file directly without ever calling this endpoint. Real confidentiality
     * would need the bucket private + every playback URL presigned per-request, not just this
     * one action — a bigger storage change, not something this permission check can close.
     */
    public function download(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (! $this->contentAccess->canDownloadVideos($user)) {
            throw DomainException::of('VIDEO_DOWNLOAD_NOT_ALLOWED', 403);
        }
        $video = Video::query()->published()->findOrFail($id);
        if (! $video->video_url) {
            throw DomainException::of('NOT_FOUND', 404);
        }

        return $this->ok(['url' => $video->video_url]);
    }
}
