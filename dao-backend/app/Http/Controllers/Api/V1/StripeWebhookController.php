<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Orders\OrderService;
use App\Services\Payments\Gateways\StripeCheckoutGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/** The ONLY way a Stripe order becomes paid: a correctly signed webhook. */
class StripeWebhookController extends Controller
{
    public function __invoke(Request $request, StripeCheckoutGateway $stripe, OrderService $orders): JsonResponse
    {
        $event = $stripe->verifyWebhook($request->getContent(), $request->header('Stripe-Signature'));
        $session = $event['data']['object'] ?? [];

        $paid = ($event['type'] === 'checkout.session.completed' && ($session['payment_status'] ?? null) === 'paid')
            || $event['type'] === 'checkout.session.async_payment_succeeded';

        if ($paid) {
            $order = Order::query()->find((int) ($session['metadata']['order_id'] ?? 0));
            if ($order && (int) ($session['amount_total'] ?? -1) === $order->grand_total) {
                $orders->markPaid($order, null, $session['id'] ?? null, ['payment_intent' => $session['payment_intent'] ?? null]);
            } else {
                Log::warning('stripe.webhook_mismatch', ['session' => $session['id'] ?? null]);
            }
        }

        return $this->ok(['received' => true]);
    }
}
