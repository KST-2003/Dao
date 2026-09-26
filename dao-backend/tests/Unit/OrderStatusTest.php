<?php

use App\Enums\OrderStatus;

it('allows only defined transitions', function () {
    expect(OrderStatus::PendingPayment->canTransitionTo(OrderStatus::Paid))->toBeTrue()
        ->and(OrderStatus::Shipped->canTransitionTo(OrderStatus::Delivered))->toBeTrue()
        ->and(OrderStatus::Delivered->canTransitionTo(OrderStatus::Processing))->toBeFalse()
        ->and(OrderStatus::Cancelled->allowedNext())->toBe([])
        ->and(OrderStatus::Refunded->isFinal())->toBeTrue();
});
