<?php

namespace App\Support;

/** Money is always an integer in minor units (satang / pya). Never floats. */
final class Money
{
    public static function percentOf(int $amount, float|string $percent): int
    {
        return intdiv($amount * (int) round(((float) $percent) * 100), 10000);
    }
}
