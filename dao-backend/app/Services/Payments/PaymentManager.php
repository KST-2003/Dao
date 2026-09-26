<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGatewayInterface;
use App\Enums\PaymentMethod;
use App\Exceptions\DomainException;

/** Registry of gateways. Checkout asks this for "the gateway for method X" and nothing more. */
class PaymentManager
{
    /** @var array<string, PaymentGatewayInterface> */
    private array $gateways = [];

    /** @param  iterable<PaymentGatewayInterface>  $gateways */
    public function __construct(iterable $gateways)
    {
        foreach ($gateways as $gateway) {
            $this->gateways[$gateway->method()->value] = $gateway;
        }
    }

    /** Methods that are both enabled (PAYMENT_METHODS) and configured. */
    public function available(): array
    {
        $enabled = config('dao.payments.methods', []);

        return array_values(array_filter(
            $this->gateways,
            fn (PaymentGatewayInterface $g) => in_array($g->method()->value, $enabled, true) && $g->isConfigured(),
        ));
    }

    public function gateway(PaymentMethod $method): PaymentGatewayInterface
    {
        foreach ($this->available() as $gateway) {
            if ($gateway->method() === $method) {
                return $gateway;
            }
        }

        throw DomainException::of('PAYMENT_METHOD_UNAVAILABLE', 422);
    }

    /** Refunds need the gateway even if it was disabled later. */
    public function gatewayForRefund(string $provider): ?PaymentGatewayInterface
    {
        return $this->gateways[$provider] ?? null;
    }
}
