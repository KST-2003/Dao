<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PreorderStatus;
use App\Http\Requests\Admin\PreorderMarkPaidRequest;
use App\Http\Requests\Admin\PreorderTransitionRequest;
use App\Http\Requests\Admin\PreorderRefundRequest;
use App\Models\Preorder;
use App\Services\Orders\PreorderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PreorderController extends AdminController
{
    public function __construct(private readonly PreorderService $preorders) {}

    public function index(Request $request): JsonResponse
    {
        $query = Preorder::query()->with('user:id,name,display_name,phone,email')->withCount('items')
            ->when($request->filled('status'), fn ($q) => $q->where('status', (string) $request->input('status')))
            ->when($request->filled('destination'), fn ($q) => $q->where('destination', (string) $request->input('destination')))
            ->when($request->filled('q'), fn ($q) => $q->where(fn ($w) => $w
                ->where('preorder_number', 'like', $this->like((string) $request->input('q')))
                ->orWhereHas('user', fn ($u) => $u->where('phone', 'like', $this->like((string) $request->input('q')))->orWhere('email', 'like', $this->like((string) $request->input('q'))))))
            ->latest('submitted_at');

        return $this->paginated($query->paginate($this->perPage()), fn (Preorder $p) => [
            'id' => $p->id,
            'preorder_number' => $p->preorder_number,
            'customer' => $p->user?->display_name ?: ($p->user?->name ?: $p->user?->phone),
            'status' => $p->status->value,
            'destination' => $p->destination->value,
            'grand_total' => $p->grand_total,
            'currency' => $p->currency,
            'items_count' => $p->items_count,
            'submitted_at' => $p->submitted_at?->toIso8601String(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $preorder = Preorder::query()->with(['items.product', 'user', 'statusHistory', 'order.payments'])->findOrFail($id);

        return response()->json(['data' => array_merge($preorder->attributesToArray(), [
            'status' => $preorder->status->value,
            'destination' => $preorder->destination->value,
            'items' => $preorder->items,
            'customer' => $preorder->user?->only(['id', 'name', 'display_name', 'phone', 'email']),
            'history' => $preorder->statusHistory,
            'order' => $preorder->order ? [
                'id' => $preorder->order->id,
                'order_number' => $preorder->order->order_number,
                'status' => $preorder->order->status->value,
                'payment_status' => $preorder->order->payment_status->value,
                'payment_method' => $preorder->order->payment_method->value,
                'payments' => $preorder->order->payments->map(fn ($p) => $p->only(['id', 'provider', 'provider_reference', 'amount', 'currency', 'status', 'paid_at'])),
            ] : null,
            'steps' => array_map(fn (PreorderStatus $s) => $s->value, PreorderStatus::path($preorder->destination)),
            'allowed_next' => array_map(fn (PreorderStatus $s) => $s->value, $preorder->status->adminNext($preorder->destination)),
            'can_refund' => $preorder->status->isRefundable(),
            'can_mark_paid' => $preorder->status === PreorderStatus::WaitingPayment && $preorder->order_id !== null,
        ])]);
    }

    public function transition(PreorderTransitionRequest $request, int $id): JsonResponse
    {
        $preorder = Preorder::query()->findOrFail($id);
        $from = $preorder->status->value;
        $this->preorders->transition($preorder, PreorderStatus::from((string) $request->input('status')), $this->admin(), $request->safe()->only(['note', 'shipping_fee', 'carrier', 'tracking_number']));
        $this->audit('preorder.status_changed', $preorder, $request->safe()->only(['status', 'shipping_fee', 'carrier', 'tracking_number']) + ['from' => $from], $request->input('note'));

        return $this->show($id);
    }

    /** Bank transfer confirmation by staff; the backend then starts processing. */
    public function markPaid(PreorderMarkPaidRequest $request, int $id): JsonResponse
    {
        $preorder = Preorder::query()->findOrFail($id);
        $this->preorders->markPaid($preorder, $this->admin(), $request->input('reference'), (string) $request->input('note'));
        $this->audit('preorder.marked_paid', $preorder, ['reference' => $request->input('reference')], (string) $request->input('note'));

        return $this->show($id);
    }

    public function refund(PreorderRefundRequest $request, int $id): JsonResponse
    {
        $preorder = Preorder::query()->findOrFail($id);
        $this->preorders->refund($preorder, $this->admin(), (string) $request->input('note'));
        $this->audit('preorder.refunded', $preorder, null, (string) $request->input('note'));

        return $this->show($id);
    }
}
