<?php

namespace App\Enums;

/** Where a pre-order ships; decides the fulfilment path (Myanmar goes overseas via courier). */
enum PreorderDestination: string
{
    case Thailand = 'thailand';
    case Myanmar = 'myanmar';

    public static function fromCountry(?string $countryCode): ?self
    {
        return match (strtoupper((string) $countryCode)) {
            'TH' => self::Thailand,
            'MM' => self::Myanmar,
            default => null,
        };
    }
}
