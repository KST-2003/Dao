<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\SaveableType;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\ProductCardResource;
use App\Http\Resources\Api\RecipeCardResource;
use App\Http\Resources\Api\VideoCardResource;
use App\Models\Product;
use App\Models\Recipe;
use App\Models\Video;
use App\Services\Content\EngagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Unified wishlist: saved products, videos, recipes. */
class SavedItemController extends Controller
{
    public function __construct(private readonly EngagementService $engagement) {}

    public function index(Request $request, string $type): JsonResponse
    {
        $saveable = SaveableType::tryFrom($type) ?? abort(404);
        $user = $request->user();
        $ids = $user->savedItems()->where('saveable_type', $saveable->value)->latest('created_at')->pluck('saveable_id')->all();
        $order = fn ($m) => array_search($m->id, $ids, true);

        $request->attributes->set("saved_{$saveable->value}_ids", $ids);

        $data = match ($saveable) {
            SaveableType::Product => ProductCardResource::collection(Product::query()->published()->whereIn('id', $ids)->with(['translations', 'images', 'variants'])->get()->sortBy($order)->values()),
            SaveableType::Video => VideoCardResource::collection(Video::query()->published()->whereIn('id', $ids)->with('translations')->get()->sortBy($order)->values()),
            SaveableType::Recipe => RecipeCardResource::collection(Recipe::query()->published()->whereIn('id', $ids)->with('translations')->get()->sortBy($order)->values()),
        };

        return $this->ok($data);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::enum(SaveableType::class)],
            'id' => ['required', 'integer'],
        ]);
        $this->engagement->save($request->user(), SaveableType::from($data['type']), (int) $data['id']);

        return $this->ok(['saved' => true], 201);
    }

    public function destroy(Request $request, string $type, int $id): JsonResponse
    {
        $this->engagement->unsave($request->user(), SaveableType::tryFrom($type) ?? abort(404), $id);

        return $this->ok(['saved' => false]);
    }
}
