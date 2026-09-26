<?php

namespace App\Services\Auth;

use App\Exceptions\DomainException;

/**
 * Normalizes phone numbers to E.164. Thailand (+66) and Myanmar (+95) get strict mobile rules;
 * other countries must already be in +<country><number> form.
 * (For more countries in future: composer require giggsey/libphonenumber-for-php.)
 */
class PhoneNormalizer
{
    private const DEFAULT_COUNTRY_CODES = ['TH' => '66', 'MM' => '95'];

    public function normalize(string $raw, string $defaultCountry = 'TH'): string
    {
        $digits = preg_replace('/[^\d+]/', '', trim($raw)) ?? '';
        if (str_starts_with($digits, '00')) {
            $digits = '+'.substr($digits, 2);
        }

        if (! str_starts_with($digits, '+')) {
            $cc = self::DEFAULT_COUNTRY_CODES[strtoupper($defaultCountry)] ?? null;
            if ($cc === null) {
                throw DomainException::of('PHONE_INVALID', 422);
            }
            $digits = '+'.$cc.ltrim($digits, '0');
        }

        $e164 = '+'.preg_replace('/\D/', '', $digits);

        if (str_starts_with($e164, '+66')) {
            // Thai mobiles: 0[6|8|9]X-XXX-XXXX → +66 [6|8|9] + 8 digits
            if (! preg_match('/^\+66[689]\d{8}$/', $e164)) {
                throw DomainException::of('PHONE_INVALID', 422);
            }
        } elseif (str_starts_with($e164, '+95')) {
            // Myanmar mobiles: 09 + 7–9 digits → +95 9 + 7–9 digits
            if (! preg_match('/^\+959\d{7,9}$/', $e164)) {
                throw DomainException::of('PHONE_INVALID', 422);
            }
        } elseif (! preg_match('/^\+[1-9]\d{7,14}$/', $e164)) {
            throw DomainException::of('PHONE_INVALID', 422);
        }

        return $e164;
    }
}
