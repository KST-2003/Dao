<?php

namespace App\Support;

use App\Enums\Locale;

/** Helper for JSON-map localized columns: {"en": "...", "th": "...", "my": "..."}. */
final class Localized
{
    /** @param  array<string, string>|null  $map */
    public static function pick(?array $map, ?string $locale = null): ?string
    {
        if ($map === null || $map === []) {
            return null;
        }
        foreach (Locale::fallbackChain($locale ?? app()->getLocale()) as $candidate) {
            if (($map[$candidate] ?? '') !== '') {
                return $map[$candidate];
            }
        }

        return collect($map)->first(fn ($v) => $v !== null && $v !== '');
    }
}
