<?php

namespace App\Services\Sms;

use App\Contracts\OtpProviderInterface;
use App\Exceptions\DomainException;
use App\Models\OtpChallenge;

/** Test double: generates codes in memory, no network. Bound only when APP_ENV=testing. */
class FakeOtpProvider implements OtpProviderInterface
{
    /** @var array<string, string> phone => code */
    public array $sent = [];

    public function request(string $phoneE164, string $locale): array
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $this->sent[$phoneE164] = $code;

        return ['code_hash' => $this->hash($phoneE164, $code), 'provider_token' => null];
    }

    public function verify(OtpChallenge $challenge, string $pin): void
    {
        if (! hash_equals((string) $challenge->code_hash, $this->hash($challenge->phone, $pin))) {
            $left = max(0, config('dao.otp.max_attempts') - $challenge->attempts);
            throw DomainException::of('OTP_INVALID', 422, [], ['attempts_remaining' => $left]);
        }
    }

    public function lastCodeFor(string $phone): ?string
    {
        return $this->sent[$phone] ?? null;
    }

    private function hash(string $phone, string $code): string
    {
        return hash_hmac('sha256', $phone.'|'.$code, (string) config('app.key'));
    }
}
