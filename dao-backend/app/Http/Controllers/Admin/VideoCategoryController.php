<?php

namespace App\Http\Controllers\Admin;

use App\Exceptions\DomainException;
use App\Http\Requests\Admin\VideoCategoryRequest;
use App\Models\Video;
use App\Models\VideoCategory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class VideoCategoryController extends TranslatedCrudController
{
    protected function model(): string
    {
        return VideoCategory::class;
    }

    protected function request(): string
    {
        return VideoCategoryRequest::class;
    }

    protected function auditName(): string
    {
        return 'video_category';
    }

    protected function present(Model $model): array
    {
        return parent::present($model) + ['videos_count' => $model->videos()->count()];
    }

    /** Videos reference the slug, so a rename carries them along. */
    public function update(int $id): JsonResponse
    {
        return DB::transaction(function () use ($id) {
            $old = VideoCategory::query()->findOrFail($id)->slug;
            $response = parent::update($id);
            $new = VideoCategory::query()->findOrFail($id)->slug;
            if ($old !== $new) {
                Video::withTrashed()->where('category', $old)->update(['category' => $new]);
            }

            return $response;
        });
    }

    protected function beforeDelete(Model $model): void
    {
        if ($model->videos()->exists()) {
            throw DomainException::of('VIDEO_CATEGORY_IN_USE', 409);
        }
    }
}
