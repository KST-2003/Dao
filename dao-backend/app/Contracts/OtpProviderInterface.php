<?php

namespace App\Contracts;

use App\Models\OtpChallenge;

/**
 * Owns both halves of an OTP challenge: generating/sending it, and verifying a submitted pin.
 * Local/testing providers generate and hash the code themselves; a real provider (ThaiBulkSMS)
 * delegates both steps to its API and gives us an opaque token to verify against later.
 */
interface OtpProviderInterface
{
    /**
     * @return array{code_hash: ?string, provider_token: ?string} exactly one of the two is set —
     *         code_hash for providers that verify locally, provider_token for ones that verify remotely.
     *
     * @throws \App\Exceptions\DomainException SMS_NOT_CONFIGURED | SMS_SEND_FAILED
     */
    public function request(string $phoneE164, string $locale): array;

    /**
     * @throws \App\Exceptions\DomainException OTP_INVALID
     */
    public function verify(OtpChallenge $challenge, string $pin): void;
}
