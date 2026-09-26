<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\OrderResource;
use App\Models\Order;
use App\Services\Orders\CheckoutService;
use App\Services\Orders\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    /** Tabs in the app: all / active / delivered / cancelled. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $data = $request->validate(['tab' => ['nullable', Rule::in(['all', 'active', 'delivered', 'cancelled'])]]);
        $query = $request->user()->orders()->with('items')->latest('placed_at');
        match ($data['tab'] ?? 'all') {
            'active' => $query->whereIn('status', ['pending_payment', 'paid', 'processing', 'packing', 'shipped']),
            'delivered' => $query->where('status', 'delivered'),
            'cancelled' => $query->whereIn('status', ['cancelled', 'refunded']),
            default => null,
        };

        return OrderResource::collection($query->paginate(15));
    }

    public function show(Request $request, int $id): OrderResource
    {
        return new OrderResource($this->owned($request, $id)->load(['items', 'shipment', 'statusHistory']));
    }

    public function cancel(Request $request, int $id, OrderService $orders): OrderResource
    {
        $order = $orders->cancelByCustomer($this->owned($request, $id), $request->user());

        return new OrderResource($order->load(['items', 'shipment', 'statusHistory']));
    }

    /** Resume payment (e.g. the Stripe page was closed). */
    public function pay(Request $request, int $id, CheckoutService $checkout): JsonResponse
    {
        return $this->ok($checkout->initiatePayment($this->owned($request, $id))->toArray());
    }

    private function owned(Request $request, int $id): Order
    {
        return Order::query()->where('user_id', $request->user()->id)->findOrFail($id);
    }
}
