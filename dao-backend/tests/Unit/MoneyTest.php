<?php

use App\Support\Money;

it('computes percentages on integer minor units without floats drifting', function () {
    expect(Money::percentOf(59000, 10))->toBe(5900)
        ->and(Money::percentOf(59000, '5.00'))->toBe(2950)
        ->and(Money::percentOf(999, 33.33))->toBe(332);
});
