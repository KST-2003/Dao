<?php

namespace App\Contracts;

use App\DTOs\PaymentInitiation;
use App\Enums\PaymentMethod;
use App\Models\Order;
use App\Models\Payment;

/**
 * Provider-independent payment gateway. Checkout never knows which provider it talks to.
 * Adding a provider = new class implementing this + registering it in PaymentManager.
 */
interface PaymentGatewayInterface
{
    public function method(): PaymentMethod;

    /** False when credentials/settings are missing — the method is then hidden, never faked. */
    public function isConfigured(): bool;

    /** Start payment for a pending order (redirect URL, transfer instructions, …). */
    public function initiate(Order $order, Payment $payment): PaymentInitiation;

    /** Refund at the provider. Returns false if the refund must be done manually (e.g. bank transfer). */
    public function refund(Payment $payment, int $amount): bool;
}
