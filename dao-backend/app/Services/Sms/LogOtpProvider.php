<?php

namespace App\Services\Sms;

use App\Contracts\OtpProviderInterface;
use App\Exceptions\DomainException;
use App\Models\OtpChallenge;
use Illuminate\Support\Facades\Log;

/**
 * LOCAL DEVELOPMENT ONLY. Generates the code itself and writes it to the log instead of
 * sending an SMS. AppServiceProvider refuses to bind this outside APP_ENV=local.
 */
class LogOtpProvider implements OtpProviderInterface
{
    public function request(string $phoneE164, string $locale): array
    {
        $length = (int) config('dao.otp.length');
        $code = str_pad((string) random_int(0, 10 ** $length - 1), $length, '0', STR_PAD_LEFT);
        $minutes = intdiv((int) config('dao.otp.ttl_seconds'), 60);

        Log::info('[DEV SMS — not sent] '.$phoneE164.': '.__('auth.otp_sms', ['code' => $code, 'minutes' => $minutes], $locale));

        return ['code_hash' => $this->hash($phoneE164, $code), 'provider_token' => null];
    }

    public function verify(OtpChallenge $challenge, string $pin): void
    {
        if (! hash_equals((string) $challenge->code_hash, $this->hash($challenge->phone, $pin))) {
            $left = max(0, config('dao.otp.max_attempts') - $challenge->attempts);
            throw DomainException::of('OTP_INVALID', 422, [], ['attempts_remaining' => $left]);
        }
    }

    private function hash(string $phone, string $code): string
    {
        return hash_hmac('sha256', $phone.'|'.$code, (string) config('app.key'));
    }
}
