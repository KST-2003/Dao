<?php

namespace App\DTOs;

final readonly class PreorderData
{
    /** @param  list<array{variant_id: int, quantity: int}>  $lines */
    public function __construct(
        public array $lines,
        public int $addressId,
        public ?int $expectedTotal,
        public ?string $notes,
        public ?string $idempotencyKey,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            lines: array_map(fn (array $l) => ['variant_id' => (int) $l['variant_id'], 'quantity' => (int) $l['quantity']], $data['items']),
            addressId: (int) $data['address_id'],
            expectedTotal: isset($data['expected_total']) ? (int) $data['expected_total'] : null,
            notes: $data['notes'] ?? null,
            idempotencyKey: $data['idempotency_key'] ?? null,
        );
    }
}
