<?php

namespace App\Services\Home;

use App\Models\Collection;
use App\Models\Product;
use App\Models\Recipe;
use App\Models\Video;
use App\Services\Catalog\ProductQueryService;
use Illuminate\Database\Eloquent\Builder;

/**
 * Global search across products, collections, videos and recipes (categorized results).
 * V1 uses indexed LIKE on translation titles; swap for Meilisearch/Scout when the catalog grows.
 */
class SearchService
{
    public function __construct(private readonly ProductQueryService $products) {}

    public function search(string $term, int $limit = 6): array
    {
        $like = '%'.str_replace(['%', '_'], ['\%', '\_'], mb_substr(trim($term), 0, 80)).'%';
        $byTitle = fn (string $field) => fn (Builder $q) => $q->where($field, 'like', $like);

        return [
            'products' => $this->products->search(Product::query()->published(), $term)->with(['translations', 'images', 'variants'])->limit($limit)->get(),
            'collections' => Collection::query()->live()->whereHas('translations', $byTitle('name'))->with('translations')->limit($limit)->get(),
            'videos' => Video::query()->published()->whereHas('translations', $byTitle('title'))->with('translations')->limit($limit)->get(),
            'recipes' => Recipe::query()->published()->whereHas('translations', $byTitle('title'))->with('translations')->limit($limit)->get(),
        ];
    }
}
