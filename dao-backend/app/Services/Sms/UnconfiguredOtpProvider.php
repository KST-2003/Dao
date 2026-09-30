<?php

namespace App\Services\Sms;

use App\Contracts\OtpProviderInterface;
use App\Exceptions\DomainException;
use App\Models\OtpChallenge;

/** Bound when no OTP provider is configured. Never pretends an SMS was sent. */
class UnconfiguredOtpProvider implements OtpProviderInterface
{
    public function request(string $phoneE164, string $locale): array
    {
        throw DomainException::of('SMS_NOT_CONFIGURED', 503);
    }

    public function verify(OtpChallenge $challenge, string $pin): void
    {
        throw DomainException::of('SMS_NOT_CONFIGURED', 503);
    }
}
