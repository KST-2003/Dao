<?php

namespace App\Http\Controllers\Admin;

use App\Exceptions\DomainException;
use App\Http\Requests\Admin\CategoryRequest;
use App\Models\Category;
use Illuminate\Database\Eloquent\Model;

class CategoryController extends TranslatedCrudController
{
    protected function model(): string
    {
        return Category::class;
    }

    protected function request(): string
    {
        return CategoryRequest::class;
    }

    protected function auditName(): string
    {
        return 'category';
    }

    protected function beforeDelete(Model $model): void
    {
        if ($model->products()->exists() || $model->children()->exists()) {
            throw DomainException::of('CATEGORY_IN_USE', 409);
        }
    }
}
