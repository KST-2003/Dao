<?php

namespace App\Enums;

/** Currencies customers can browse and pay in. Money is integer minor units (satang / pya) in either. */
enum Currency: string
{
    case THB = 'THB';
    case MMK = 'MMK';

    public static function fromHeader(?string $value): self
    {
        return self::tryFrom(strtoupper(trim((string) $value))) ?? self::THB;
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }
}
