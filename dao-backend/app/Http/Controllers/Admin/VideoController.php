<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\VideoRequest;
use App\Models\Video;
use App\Services\Home\HomeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Vlogs, fashion videos, tutorials, shorts and recipe videos — one content system (content_type). */
class VideoController extends AdminController
{
    public function index(Request $request): JsonResponse
    {
        $query = Video::query()->with('translations')
            ->when($request->filled('content_type'), fn ($q) => $q->where('content_type', (string) $request->input('content_type')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', (string) $request->input('status')))
            ->when($request->filled('q'), fn ($q) => $q->whereHas('translations', fn ($t) => $t->where('title', 'like', $this->like((string) $request->input('q')))))
            ->latest('id');

        return $this->paginated($query->paginate($this->perPage()), fn (Video $v) => [
            'id' => $v->id,
            'title' => $v->translated('title'),
            'content_type' => $v->content_type->value,
            'category' => $v->category,
            'status' => $v->status->value,
            'thumbnail_url' => $v->thumbnail_url,
            'duration_seconds' => $v->duration_seconds,
            'view_count' => $v->view_count,
            'like_count' => $v->like_count,
            'published_at' => $v->published_at?->toIso8601String(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => $this->present(Video::query()->findOrFail($id))]);
    }

    public function store(VideoRequest $request): JsonResponse
    {
        $video = DB::transaction(function () use ($request) {
            $video = Video::query()->create($request->safe()->except(['translations', 'products']) + ['author_id' => $this->admin()->id]);
            $video->syncTranslations($request->input('translations', []));
            $this->syncProducts($video, $request->input('products', []));

            return $video;
        });
        $this->audit('video.created', $video);
        HomeService::flushCache(); // could land in from_dao

        return response()->json(['data' => $this->present($video)], 201);
    }

    public function update(VideoRequest $request, int $id): JsonResponse
    {
        $video = Video::query()->findOrFail($id);
        DB::transaction(function () use ($request, $video) {
            $video->fill($request->safe()->except(['translations', 'products']))->save();
            if ($request->has('translations')) {
                $video->syncTranslations($request->input('translations'));
            }
            if ($request->has('products')) {
                $this->syncProducts($video, $request->input('products'));
            }
        });
        $this->audit('video.updated', $video, $request->safe()->except('translations'));
        HomeService::flushCache();

        return response()->json(['data' => $this->present($video->fresh())]);
    }

    public function destroy(int $id): JsonResponse
    {
        $video = Video::query()->findOrFail($id);
        $video->delete();
        $this->audit('video.deleted', $video);
        HomeService::flushCache();

        return response()->json(['data' => ['deleted' => true]]);
    }

    /** "Shop this look": products featured in the video, in display order. */
    private function syncProducts(Video $video, array $products): void
    {
        $video->products()->sync(collect($products)->values()->mapWithKeys(fn ($p, $i) => [
            $p['id'] => ['sort_order' => $i, 'timestamp_seconds' => $p['timestamp_seconds'] ?? null],
        ])->all());
    }

    private function present(Video $video): array
    {
        $video->load(['translations', 'products.translations']);

        return $this->withTranslations($video, [
            'content_type' => $video->content_type->value,
            'status' => $video->status->value,
            'products' => $video->products->map(fn ($p) => [
                'id' => $p->id, 'name' => $p->translated('name'), 'timestamp_seconds' => $p->pivot->timestamp_seconds,
            ]),
        ]);
    }
}
