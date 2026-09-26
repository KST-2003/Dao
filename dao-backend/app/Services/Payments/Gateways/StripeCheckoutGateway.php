<?php

namespace App\Services\Payments\Gateways;

use App\Contracts\PaymentGatewayInterface;
use App\DTOs\PaymentInitiation;
use App\Enums\PaymentMethod;
use App\Exceptions\DomainException;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Stripe Checkout (cards + PromptPay in THB). The app opens the hosted page; the order becomes
 * paid ONLY when Stripe's signed webhook arrives (see StripeWebhookController).
 */
class StripeCheckoutGateway implements PaymentGatewayInterface
{
    public function __construct(
        private readonly ?string $secret,
        private readonly ?string $webhookSecret,
        private readonly string $successUrl,
        private readonly string $cancelUrl,
    ) {}

    public function method(): PaymentMethod
    {
        return PaymentMethod::Stripe;
    }

    public function isConfigured(): bool
    {
        return (bool) $this->secret && (bool) $this->webhookSecret;
    }

    public function initiate(Order $order, Payment $payment): PaymentInitiation
    {
        $response = Http::asForm()->withToken((string) $this->secret)->timeout(15)
            ->withHeaders(['Idempotency-Key' => 'dao-payment-'.$payment->id])
            ->post('https://api.stripe.com/v1/checkout/sessions', [
                'mode' => 'payment',
                'client_reference_id' => (string) $order->id,
                'success_url' => $this->successUrl.'?order='.$order->id,
                'cancel_url' => $this->cancelUrl.'?order='.$order->id,
                'payment_method_types' => strtolower($order->currency) === 'thb' ? ['card', 'promptpay'] : ['card'],
                'line_items' => [[
                    'quantity' => 1,
                    'price_data' => [
                        'currency' => strtolower($order->currency),
                        'unit_amount' => $order->grand_total,
                        'product_data' => ['name' => 'DAO order '.$order->order_number],
                    ],
                ]],
                'metadata' => ['order_id' => $order->id, 'payment_id' => $payment->id],
            ]);

        if ($response->failed()) {
            Log::warning('stripe.session_failed', ['order' => $order->id, 'status' => $response->status()]);
            throw DomainException::of('PAYMENT_PROVIDER_ERROR', 502);
        }

        return new PaymentInitiation('redirect', $response->json('url'), $response->json('id'));
    }

    public function refund(Payment $payment, int $amount): bool
    {
        $intent = $payment->meta['payment_intent'] ?? null;
        if (! $intent) {
            return false;
        }
        $response = Http::asForm()->withToken((string) $this->secret)->timeout(15)
            ->post('https://api.stripe.com/v1/refunds', ['payment_intent' => $intent, 'amount' => $amount]);
        if ($response->failed()) {
            throw DomainException::of('PAYMENT_PROVIDER_ERROR', 502);
        }

        return true;
    }

    /**
     * Verify the Stripe-Signature header (HMAC-SHA256, 5-minute tolerance) and return the event.
     *
     * @return array<string, mixed>
     */
    public function verifyWebhook(string $payload, ?string $signatureHeader): array
    {
        if (! $this->webhookSecret || ! $signatureHeader) {
            throw DomainException::of('INVALID_SIGNATURE', 400);
        }
        $parts = [];
        foreach (explode(',', $signatureHeader) as $kv) {
            [$k, $v] = array_pad(explode('=', $kv, 2), 2, null);
            $parts[$k][] = $v;
        }
        $timestamp = (int) ($parts['t'][0] ?? 0);
        $expected = hash_hmac('sha256', $timestamp.'.'.$payload, $this->webhookSecret);
        $valid = collect($parts['v1'] ?? [])->contains(fn ($sig) => is_string($sig) && hash_equals($expected, $sig));

        if (! $valid || abs(time() - $timestamp) > 300) {
            throw DomainException::of('INVALID_SIGNATURE', 400);
        }

        return json_decode($payload, true, 512, JSON_THROW_ON_ERROR);
    }
}
