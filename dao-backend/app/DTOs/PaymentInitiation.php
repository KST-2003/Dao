<?php

namespace App\DTOs;

final readonly class PaymentInitiation
{
    /**
     * @param  string  $action  none | redirect | bank_transfer | collect_on_delivery
     * @param  array<string, mixed>  $instructions
     */
    public function __construct(
        public string $action,
        public ?string $redirectUrl = null,
        public ?string $providerReference = null,
        public array $instructions = [],
    ) {}

    public function toArray(): array
    {
        return ['action' => $this->action, 'redirect_url' => $this->redirectUrl, 'instructions' => $this->instructions];
    }
}
