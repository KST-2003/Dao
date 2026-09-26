<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\AdminRequest;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * CRUD for admin-managed, translatable records (categories, collections, tiers, rewards, banners).
 * Subclasses declare the model, the FormRequest and optional relation syncing.
 */
abstract class TranslatedCrudController extends AdminController
{
    /** @return class-string<Model> */
    abstract protected function model(): string;

    /** @return class-string<AdminRequest> */
    abstract protected function request(): string;

    abstract protected function auditName(): string;

    /** Keys handled by afterSave rather than mass assignment. */
    protected function relationKeys(): array
    {
        return [];
    }

    protected function query(Request $request): Builder
    {
        return $this->model()::query()->with('translations')->orderBy('sort_order')->orderBy('id');
    }

    protected function afterSave(Model $model, AdminRequest $request): void {}

    protected function beforeDelete(Model $model): void {}

    protected function present(Model $model): array
    {
        return $this->withTranslations($model);
    }

    public function index(Request $request): JsonResponse
    {
        return $this->paginated($this->query($request)->paginate($this->perPage()), fn (Model $m) => $this->present($m));
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => $this->present($this->model()::query()->findOrFail($id))]);
    }

    public function store(): JsonResponse
    {
        /** @var AdminRequest $request */
        $request = app($this->request());
        $model = DB::transaction(function () use ($request) {
            $model = $this->model()::query()->create($request->safe()->except(['translations', ...$this->relationKeys()]));
            $model->syncTranslations($request->input('translations', []));
            $this->afterSave($model, $request);

            return $model;
        });
        $this->audit($this->auditName().'.created', $model);

        return response()->json(['data' => $this->present($model->fresh())], 201);
    }

    public function update(int $id): JsonResponse
    {
        /** @var AdminRequest $request */
        $request = app($this->request());
        $model = $this->model()::query()->findOrFail($id);
        DB::transaction(function () use ($request, $model) {
            $model->fill($request->safe()->except(['translations', ...$this->relationKeys()]))->save();
            if ($request->has('translations')) {
                $model->syncTranslations($request->input('translations'));
            }
            $this->afterSave($model, $request);
        });
        $this->audit($this->auditName().'.updated', $model, $request->safe()->except('translations'));

        return response()->json(['data' => $this->present($model->fresh())]);
    }

    public function destroy(int $id): JsonResponse
    {
        $model = $this->model()::query()->findOrFail($id);
        $this->beforeDelete($model);
        $model->delete();
        $this->audit($this->auditName().'.deleted', $model);

        return response()->json(['data' => ['deleted' => true]]);
    }
}
