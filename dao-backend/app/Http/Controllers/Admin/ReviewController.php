<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ReviewStatus;
use App\Models\Review;
use App\Services\Content\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReviewController extends AdminController
{
    public function index(Request $request): JsonResponse
    {
        $query = Review::query()->with(['user:id,name,display_name', 'product.translations'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', (string) $request->input('status')))
            ->when($request->boolean('reported'), fn ($q) => $q->where('report_count', '>', 0))
            ->latest('id');

        return $this->paginated($query->paginate($this->perPage()), fn (Review $r) => [
            'id' => $r->id,
            'product' => ['id' => $r->product_id, 'name' => $r->product?->translated('name')],
            'user' => $r->user?->display_name ?: $r->user?->name,
            'rating' => $r->rating,
            'body' => $r->body,
            'photos' => $r->photos ?? [],
            'is_verified_purchase' => $r->is_verified_purchase,
            'status' => $r->status->value,
            'report_count' => $r->report_count,
            'created_at' => $r->created_at?->toIso8601String(),
        ]);
    }

    public function moderate(Request $request, int $id, ReviewService $reviews): JsonResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in([ReviewStatus::Approved->value, ReviewStatus::Rejected->value])]]);
        $review = $reviews->moderate(Review::query()->findOrFail($id), ReviewStatus::from($data['status']), $this->admin());
        $this->audit('review.moderated', $review, ['status' => $data['status']]);

        return response()->json(['data' => ['id' => $review->id, 'status' => $review->status->value]]);
    }
}
