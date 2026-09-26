<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Http\Requests\Admin\OrderTransitionRequest;
use App\Http\Requests\Admin\RefundRequest;
use App\Http\Requests\Admin\ShipmentRequest;
use App\Models\Order;
use App\Services\Orders\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends AdminController
{
    public function __construct(private readonly OrderService $orders) {}

    public function index(Request $request): JsonResponse
    {
        $query = Order::query()->with('user:id,name,display_name,phone,email')->withCount('items')
            ->when($request->filled('status'), fn ($q) => $q->where('status', (string) $request->input('status')))
            ->when($request->filled('payment_status'), fn ($q) => $q->where('payment_status', (string) $request->input('payment_status')))
            ->when($request->filled('q'), fn ($q) => $q->where(fn ($w) => $w
                ->where('order_number', 'like', $this->like((string) $request->input('q')))
                ->orWhereHas('user', fn ($u) => $u->where('phone', 'like', $this->like((string) $request->input('q')))->orWhere('email', 'like', $this->like((string) $request->input('q'))))))
            ->when($request->filled('from'), fn ($q) => $q->where('placed_at', '>=', $request->date('from')))
            ->when($request->filled('to'), fn ($q) => $q->where('placed_at', '<=', $request->date('to')?->endOfDay()))
            ->latest('placed_at');

        return $this->paginated($query->paginate($this->perPage()), fn (Order $o) => [
            'id' => $o->id,
            'order_number' => $o->order_number,
            'customer' => $o->user?->display_name ?: ($o->user?->name ?: $o->user?->phone),
            'status' => $o->status->value,
            'payment_status' => $o->payment_status->value,
            'payment_method' => $o->payment_method->value,
            'grand_total' => $o->grand_total,
            'currency' => $o->currency,
            'items_count' => $o->items_count,
            'placed_at' => $o->placed_at?->toIso8601String(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $order = Order::query()->with(['items', 'user', 'statusHistory', 'payments', 'shipment'])->findOrFail($id);

        return response()->json(['data' => array_merge($order->attributesToArray(), [
            'status' => $order->status->value,
            'payment_status' => $order->payment_status->value,
            'items' => $order->items,
            'customer' => $order->user ? $order->user->only(['id', 'name', 'display_name', 'phone', 'email']) : null,
            'history' => $order->statusHistory,
            'payments' => $order->payments->map(fn ($p) => $p->only(['id', 'provider', 'provider_reference', 'amount', 'currency', 'status', 'paid_at', 'created_at'])),
            'shipment' => $order->shipment,
            'allowed_next' => array_map(fn (OrderStatus $s) => $s->value, $order->status->allowedNext()),
        ])]);
    }

    public function transition(OrderTransitionRequest $request, int $id): JsonResponse
    {
        $order = Order::query()->findOrFail($id);
        $from = $order->status->value;
        $this->orders->transition($order, OrderStatus::from((string) $request->input('status')), $this->admin(), $request->input('note'));
        $this->audit('order.status_changed', $order, ['from' => $from, 'to' => (string) $request->input('status')], $request->input('note'));

        return $this->show($id);
    }

    /** Bank transfer / COD confirmation by staff. */
    public function markPaid(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['reference' => ['nullable', 'string', 'max:190'], 'note' => ['required', 'string', 'max:500']]);
        $order = Order::query()->findOrFail($id);
        $this->orders->markPaid($order, $this->admin(), $data['reference'] ?? null, ['note' => $data['note']]);
        $this->audit('order.marked_paid', $order, ['reference' => $data['reference'] ?? null], $data['note']);

        return $this->show($id);
    }

    public function refund(RefundRequest $request, int $id): JsonResponse
    {
        $order = Order::query()->findOrFail($id);
        $this->orders->refund($order, $this->admin(), $request->boolean('restock'), (string) $request->input('note'));
        $this->audit('order.refunded', $order, ['restock' => $request->boolean('restock')], (string) $request->input('note'));

        return $this->show($id);
    }

    public function shipment(ShipmentRequest $request, int $id): JsonResponse
    {
        $order = Order::query()->findOrFail($id);
        $this->orders->updateShipment($order, $request->validated());
        $this->audit('order.shipment_updated', $order, $request->validated());

        return $this->show($id);
    }
}
