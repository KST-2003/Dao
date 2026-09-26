<?php

namespace App\Enums;

enum Locale: string
{
    case En = 'en';
    case Th = 'th';
    case My = 'my';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $l) => $l->value, self::cases());
    }

    /**
     * Controlled fallback order for localized content: requested → configured fallback → Thai → English.
     *
     * @return list<string>
     */
    public static function fallbackChain(?string $requested): array
    {
        $chain = [$requested, config('dao.fallback_locale', 'en'), self::Th->value, self::En->value];

        return array_values(array_unique(array_filter($chain, static fn ($l) => $l !== null && self::tryFrom($l) !== null)));
    }

    /** Parse an Accept-Language / X-Locale header value ("th-TH,th;q=0.9"). */
    public static function fromHeader(?string $header): ?self
    {
        if ($header === null || $header === '') {
            return null;
        }
        foreach (explode(',', $header) as $part) {
            $code = strtolower(substr(trim(explode(';', $part)[0]), 0, 2));
            if ($locale = self::tryFrom($code)) {
                return $locale;
            }
        }

        return null;
    }
}
