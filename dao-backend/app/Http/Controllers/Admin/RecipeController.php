<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\RecipeRequest;
use App\Models\Recipe;
use App\Services\Home\HomeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RecipeController extends AdminController
{
    public function index(Request $request): JsonResponse
    {
        $query = Recipe::query()->with('translations')
            ->when($request->filled('status'), fn ($q) => $q->where('status', (string) $request->input('status')))
            ->when($request->filled('q'), fn ($q) => $q->whereHas('translations', fn ($t) => $t->where('title', 'like', $this->like((string) $request->input('q')))))
            ->latest('id');

        return $this->paginated($query->paginate($this->perPage()), fn (Recipe $r) => [
            'id' => $r->id,
            'title' => $r->translated('title'),
            'title_th' => $r->translated('title', 'th'),
            'category' => $r->category,
            'status' => $r->status->value,
            'cover_image_url' => $r->cover_image_url,
            'difficulty' => $r->difficulty->value,
            'is_featured' => $r->is_featured,
            'published_at' => $r->published_at?->toIso8601String(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => $this->present(Recipe::query()->findOrFail($id))]);
    }

    public function store(RecipeRequest $request): JsonResponse
    {
        $recipe = DB::transaction(function () use ($request) {
            $recipe = Recipe::query()->create($request->safe()->except(['translations', 'ingredients', 'steps']));
            $recipe->syncTranslations($request->input('translations', []));
            $this->replaceChildren($recipe, $request);

            return $recipe;
        });
        $this->audit('recipe.created', $recipe);
        HomeService::flushCache(); // could land in kitchen

        return response()->json(['data' => $this->present($recipe)], 201);
    }

    public function update(RecipeRequest $request, int $id): JsonResponse
    {
        $recipe = Recipe::query()->findOrFail($id);
        DB::transaction(function () use ($request, $recipe) {
            $recipe->fill($request->safe()->except(['translations', 'ingredients', 'steps']))->save();
            if ($request->has('translations')) {
                $recipe->syncTranslations($request->input('translations'));
            }
            $this->replaceChildren($recipe, $request);
        });
        $this->audit('recipe.updated', $recipe, $request->safe()->except(['translations', 'ingredients', 'steps']));
        HomeService::flushCache();

        return response()->json(['data' => $this->present($recipe->fresh())]);
    }

    public function destroy(int $id): JsonResponse
    {
        $recipe = Recipe::query()->findOrFail($id);
        $recipe->delete();
        $this->audit('recipe.deleted', $recipe);
        HomeService::flushCache();

        return response()->json(['data' => ['deleted' => true]]);
    }

    private function replaceChildren(Recipe $recipe, RecipeRequest $request): void
    {
        if ($request->has('ingredients')) {
            $recipe->ingredients()->delete();
            foreach (array_values($request->input('ingredients')) as $i => $row) {
                $recipe->ingredients()->create([
                    'name' => array_filter($row['name']), 'quantity' => $row['quantity'] ?? null, 'unit' => $row['unit'] ?? null,
                    'product_id' => $row['product_id'] ?? null, 'sort_order' => $i,
                ]);
            }
        }
        if ($request->has('steps')) {
            $recipe->steps()->delete();
            foreach (array_values($request->input('steps')) as $i => $row) {
                $recipe->steps()->create([
                    'step_number' => $i + 1, 'instruction' => array_filter($row['instruction']),
                    'image_url' => $row['image_url'] ?? null, 'timer_seconds' => $row['timer_seconds'] ?? null,
                ]);
            }
        }
    }

    private function present(Recipe $recipe): array
    {
        $recipe->load(['translations', 'ingredients', 'steps']);

        return $this->withTranslations($recipe, [
            'difficulty' => $recipe->difficulty->value,
            'status' => $recipe->status->value,
            'ingredients' => $recipe->ingredients,
            'steps' => $recipe->steps,
        ]);
    }
}
