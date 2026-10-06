<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\AdminRequest;
use App\Http\Requests\Admin\BannerRequest;
use App\Models\Banner;
use App\Services\Home\HomeService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class BannerController extends TranslatedCrudController
{
    protected function model(): string
    {
        return Banner::class;
    }

    protected function request(): string
    {
        return BannerRequest::class;
    }

    protected function auditName(): string
    {
        return 'banner';
    }

    protected function afterSave(Model $model, AdminRequest $request): void
    {
        HomeService::flushCache(); // home_hero / home_feature are part of the cached home feed
    }

    protected function beforeDelete(Model $model): void
    {
        HomeService::flushCache();
    }

    protected function query(Request $request): Builder
    {
        return Banner::query()->with('translations')
            ->when($request->filled('placement'), fn ($q) => $q->where('placement', (string) $request->input('placement')))
            ->orderBy('placement')->orderBy('sort_order');
    }
}
