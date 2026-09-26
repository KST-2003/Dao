<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\BannerRequest;
use App\Models\Banner;
use Illuminate\Database\Eloquent\Builder;
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

    protected function query(Request $request): Builder
    {
        return Banner::query()->with('translations')
            ->when($request->filled('placement'), fn ($q) => $q->where('placement', (string) $request->input('placement')))
            ->orderBy('placement')->orderBy('sort_order');
    }
}
