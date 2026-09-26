<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\RewardRequest;
use App\Models\Reward;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class RewardController extends TranslatedCrudController
{
    protected function model(): string
    {
        return Reward::class;
    }

    protected function request(): string
    {
        return RewardRequest::class;
    }

    protected function auditName(): string
    {
        return 'reward';
    }

    protected function query(Request $request): Builder
    {
        return Reward::query()->with('translations')->orderBy('points_cost');
    }
}
