<?php

namespace App\Http\Controllers\Api\V1;

use App\DTOs\PreorderData;
use App\Enums\PaymentMethod;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\PreorderPayRequest;
use App\Http\Requests\Api\PreorderQuoteRequest;
use App\Http\Requests\Api\SubmitPreorderRequest;
use App\Http\Resources\Api\PreorderResource;
use App\Models\Preorder;
use App\Services\Orders\PreorderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class PreorderController extends Controller
{
    public function __construct(private readonly PreorderService $preorders) {}

    /** Tabs: all / active (in progress) / completed / closed (rejected, cancelled, refunded). */
    public function index(Request $request): AnonymousResourceCollection
    {
        $data = $request->validate(['tab' => ['nullable', Rule::in(['all', 'active', 'completed', 'closed'])]]);
        $query = $request->user()->preorders()->with('items')->latest('submitted_at');
        match ($data['tab'] ?? 'all') {
            'active' => $query->whereNotIn('status', ['completed', 'rejected', 'cancelled', 'refunded']),
            'completed' => $query->where('status', 'completed'),
            'closed' => $query->whereIn('status', ['rejected', 'cancelled', 'refunded']),
            default => null,
        };

        return PreorderResource::collection($query->paginate(15));
    }

    public function show(Request $request, int $id): PreorderResource
    {
        return new PreorderResource($this->owned($request, $id)->load(['items', 'statusHistory']));
    }

    public function quote(PreorderQuoteRequest $request): JsonResponse
    {
        return $this->ok($this->preorders->quote($request->user(), $request->validated('items')));
    }

    public function store(SubmitPreorderRequest $request): JsonResponse
    {
        $preorder = $this->preorders->submit($request->user(), PreorderData::fromArray($request->validated()));

        return $this->ok(new PreorderResource($preorder->load(['items', 'statusHistory'])), 201);
    }

    public function cancel(Request $request, int $id): PreorderResource
    {
        $preorder = $this->preorders->cancelByCustomer($this->owned($request, $id), $request->user());

        return new PreorderResource($preorder->load(['items', 'statusHistory']));
    }

    /** Start (or restart) payment once staff moved the pre-order to waiting_payment. */
    public function pay(PreorderPayRequest $request, int $id): JsonResponse
    {
        $method = PaymentMethod::from((string) $request->validated('payment_method'));

        return $this->ok($this->preorders->pay($this->owned($request, $id), $request->user(), $method)->toArray());
    }

    private function owned(Request $request, int $id): Preorder
    {
        return Preorder::query()->where('user_id', $request->user()->id)->findOrFail($id);
    }
}
