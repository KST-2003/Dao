<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\AdminRequest;
use App\Http\Requests\Admin\CollectionRequest;
use App\Models\Collection;
use App\Services\Home\HomeService;
use Illuminate\Database\Eloquent\Model;

class CollectionController extends TranslatedCrudController
{
    protected function model(): string
    {
        return Collection::class;
    }

    protected function request(): string
    {
        return CollectionRequest::class;
    }

    protected function auditName(): string
    {
        return 'collection';
    }

    protected function relationKeys(): array
    {
        return ['product_ids'];
    }

    protected function afterSave(Model $model, AdminRequest $request): void
    {
        if ($request->has('product_ids')) {
            $sync = collect($request->input('product_ids'))->values()->mapWithKeys(fn ($id, $i) => [$id => ['sort_order' => $i]])->all();
            $model->products()->sync($sync);
        }
        HomeService::flushCache(); // the featured collection is part of the cached home feed
    }

    protected function beforeDelete(Model $model): void
    {
        HomeService::flushCache();
    }

    protected function present(Model $model): array
    {
        return $this->withTranslations($model, ['product_ids' => $model->products()->pluck('products.id')]);
    }
}
