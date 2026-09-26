<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\CollectionResource;
use App\Http\Resources\Api\ProductCardResource;
use App\Http\Resources\Api\RecipeCardResource;
use App\Http\Resources\Api\VideoCardResource;
use App\Services\Home\SearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __invoke(Request $request, SearchService $search): JsonResponse
    {
        $data = $request->validate(['q' => ['required', 'string', 'min:1', 'max:80']]);
        $r = $search->search($data['q']);

        return $this->ok([
            'query' => $data['q'],
            'products' => ProductCardResource::collection($r['products']),
            'collections' => CollectionResource::collection($r['collections']),
            'videos' => VideoCardResource::collection($r['videos']),
            'recipes' => RecipeCardResource::collection($r['recipes']),
        ]);
    }
}
