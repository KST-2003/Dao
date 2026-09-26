<?php

namespace App\Services\Payments\Gateways;

use App\Contracts\PaymentGatewayInterface;
use App\DTOs\PaymentInitiation;
use App\Enums\PaymentMethod;
use App\Models\Order;
use App\Models\Payment;

/** No online payment. The order is processed; payment is confirmed when delivered. */
class CashOnDeliveryGateway implements PaymentGatewayInterface
{
    public function method(): PaymentMethod
    {
        return PaymentMethod::Cod;
    }

    public function isConfigured(): bool
    {
        return true;
    }

    public function initiate(Order $order, Payment $payment): PaymentInitiation
    {
        return new PaymentInitiation('collect_on_delivery', instructions: ['amount' => $order->grand_total, 'currency' => $order->currency]);
    }

    public function refund(Payment $payment, int $amount): bool
    {
        return false; // cash refunds are handled manually by staff
    }
}
