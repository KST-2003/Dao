<?php

namespace App\Services\Payments\Gateways;

use App\Contracts\PaymentGatewayInterface;
use App\DTOs\PaymentInitiation;
use App\Enums\PaymentMethod;
use App\Models\Order;
use App\Models\Payment;
use App\Services\Settings\SettingsService;

/**
 * Bank transfer / PromptPay QR. Shows the shop's account details (from settings).
 * The order stays pending_payment until an admin confirms the transfer ("Mark paid").
 */
class BankTransferGateway implements PaymentGatewayInterface
{
    public function __construct(private readonly SettingsService $settings) {}

    public function method(): PaymentMethod
    {
        return PaymentMethod::BankTransfer;
    }

    public function isConfigured(): bool
    {
        $bank = (array) $this->settings->get('payments.bank_transfer', []);

        return ! empty($bank['account_number']) || ! empty($bank['promptpay_id']);
    }

    public function initiate(Order $order, Payment $payment): PaymentInitiation
    {
        $bank = (array) $this->settings->get('payments.bank_transfer', []);

        return new PaymentInitiation('bank_transfer', instructions: [
            'bank_name' => $bank['bank_name'] ?? null,
            'account_name' => $bank['account_name'] ?? null,
            'account_number' => $bank['account_number'] ?? null,
            'promptpay_id' => $bank['promptpay_id'] ?? null,
            'amount' => $order->grand_total,
            'currency' => $order->currency,
            'reference' => $order->order_number,
        ]);
    }

    public function refund(Payment $payment, int $amount): bool
    {
        return false; // transferred back manually by staff
    }
}
