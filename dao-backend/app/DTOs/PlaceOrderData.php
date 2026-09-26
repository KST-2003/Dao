<?php

namespace App\DTOs;

use App\Enums\DeliveryMethod;
use App\Enums\PaymentMethod;

final readonly class PlaceOrderData
{
    public function __construct(
        public int $addressId,
        public DeliveryMethod $deliveryMethod,
        public PaymentMethod $paymentMethod,
        public ?string $couponCode,
        public int $pointsToRedeem,
        public ?int $expectedTotal,
        public ?string $notes,
        public ?string $idempotencyKey,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            addressId: (int) $data['address_id'],
            deliveryMethod: DeliveryMethod::from($data['delivery_method']),
            paymentMethod: PaymentMethod::from($data['payment_method']),
            couponCode: isset($data['coupon_code']) && $data['coupon_code'] !== '' ? strtoupper(trim($data['coupon_code'])) : null,
            pointsToRedeem: (int) ($data['points_to_redeem'] ?? 0),
            expectedTotal: isset($data['expected_total']) ? (int) $data['expected_total'] : null,
            notes: $data['notes'] ?? null,
            idempotencyKey: $data['idempotency_key'] ?? null,
        );
    }
}
