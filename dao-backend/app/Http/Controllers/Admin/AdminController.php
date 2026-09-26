<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Services\Audit\AuditLogger;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;

abstract class AdminController extends Controller
{
    protected function admin(): AdminUser
    {
        /** @var AdminUser */
        return request()->user();
    }

    protected function audit(string $action, ?Model $subject = null, ?array $changes = null, ?string $reason = null): void
    {
        app(AuditLogger::class)->log($this->admin(), $action, $subject, $changes, $reason);
    }

    /** Raw attributes + translations keyed by locale — what the admin edit forms need. */
    protected function withTranslations(Model $model, array $extra = []): array
    {
        $data = $model->attributesToArray();
        if (method_exists($model, 'translationsByLocale')) {
            $model->loadMissing('translations');
            $data['translations'] = $model->translationsByLocale();
            $data['display_name'] = $model->translated('name') ?? $model->translated('title');
        }

        return array_merge($data, $extra);
    }

    /** @param  callable(Model): array  $map */
    protected function paginated(LengthAwarePaginator $page, callable $map): JsonResponse
    {
        return response()->json([
            'data' => collect($page->items())->map($map)->values(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
            ],
        ]);
    }

    protected function perPage(): int
    {
        return min(100, max(5, (int) request('per_page', 20)));
    }

    protected function like(string $term): string
    {
        return '%'.str_replace(['%', '_'], ['\%', '\_'], mb_substr(trim($term), 0, 80)).'%';
    }
}
