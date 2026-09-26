<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\BannerPlacement;
use App\Enums\ContentType;
use App\Enums\SaveableType;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\BannerResource;
use App\Http\Resources\Api\RecipeCardResource;
use App\Http\Resources\Api\RecipeResource;
use App\Http\Resources\Api\VideoCardResource;
use App\Models\Banner;
use App\Models\Recipe;
use App\Models\Video;
use App\Services\Content\EngagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** DAO Kitchen: Thai homemade recipes + cooking videos. A lifestyle section, not a restaurant. */
class RecipeController extends Controller
{
    public function __construct(private readonly EngagementService $engagement) {}

    public function kitchen(Request $request): JsonResponse
    {
        $request->attributes->set('saved_recipe_ids', $this->engagement->savedIds($request->user('sanctum'), SaveableType::Recipe));

        return $this->ok([
            'banners' => BannerResource::collection(Banner::query()->live(BannerPlacement::KitchenTop)->with('translations')->get()),
            'todays_kitchen' => RecipeCardResource::collection(Recipe::query()->published()->where('is_featured', true)->with('translations')->latest('published_at')->limit(6)->get()),
            'categories' => Recipe::query()->published()->whereNotNull('category')->distinct()->pluck('category')->values(),
            'latest' => RecipeCardResource::collection(Recipe::query()->published()->with('translations')->latest('published_at')->limit(10)->get()),
            'tutorials' => VideoCardResource::collection(Video::query()->published()->whereIn('content_type', [ContentType::Recipe->value, ContentType::Tutorial->value])->with('translations')->latest('published_at')->limit(6)->get()),
        ]);
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $data = $request->validate(['category' => ['nullable', 'string', 'max:40'], 'q' => ['nullable', 'string', 'max:80']]);
        $request->attributes->set('saved_recipe_ids', $this->engagement->savedIds($request->user('sanctum'), SaveableType::Recipe));

        return RecipeCardResource::collection(Recipe::query()->published()->with('translations')
            ->when($data['category'] ?? null, fn ($q, $c) => $q->where('category', $c))
            ->when($data['q'] ?? null, fn ($q, $term) => $q->whereHas('translations', fn ($t) => $t->where('title', 'like', '%'.str_replace(['%', '_'], ['\%', '\_'], $term).'%')))
            ->latest('published_at')->paginate(12));
    }

    public function show(Request $request, int $id): RecipeResource
    {
        $request->attributes->set('saved_recipe_ids', $this->engagement->savedIds($request->user('sanctum'), SaveableType::Recipe));

        return new RecipeResource(Recipe::query()->published()->with(['translations', 'ingredients', 'steps', 'video.translations'])->findOrFail($id));
    }
}
