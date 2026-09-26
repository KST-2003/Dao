<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\BannerPlacement;
use App\Enums\SaveableType;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\BannerResource;
use App\Http\Resources\Api\CategoryResource;
use App\Http\Resources\Api\CollectionResource;
use App\Models\Banner;
use App\Models\Category;
use App\Models\Collection;
use App\Services\Content\EngagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CatalogController extends Controller
{
    public function categories(): JsonResponse
    {
        $locale = app()->getLocale();
        $data = Cache::remember("categories:v1:{$locale}", now()->addMinutes(10), fn () => CategoryResource::collection(
            Category::query()->active()->whereNull('parent_id')->orderBy('sort_order')
                ->with(['translations', 'children' => fn ($q) => $q->where('is_active', true)->with('translations')])->get()
        )->resolve());

        return $this->ok($data);
    }

    public function shopLanding(): JsonResponse
    {
        return $this->ok([
            'banners' => BannerResource::collection(Banner::query()->live(BannerPlacement::ShopTop)->with('translations')->get()),
            'collections' => CollectionResource::collection(Collection::query()->live()->with('translations')->orderBy('sort_order')->limit(8)->get()),
        ]);
    }

    public function collections(): JsonResponse
    {
        return $this->ok(CollectionResource::collection(Collection::query()->live()->with('translations')->orderBy('sort_order')->get()));
    }

    public function collection(Request $request, string $slug, EngagementService $engagement): CollectionResource
    {
        $request->attributes->set('saved_product_ids', $engagement->savedIds($request->user('sanctum'), SaveableType::Product));
        $collection = Collection::query()->live()->where('slug', $slug)
            ->with(['translations', 'products' => fn ($q) => $q->published()->with(['translations', 'images', 'variants'])])
            ->firstOrFail();

        return new CollectionResource($collection);
    }
}
