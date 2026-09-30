<?php

namespace App\Services\Sms;

use App\Contracts\OtpProviderInterface;
use App\Exceptions\DomainException;
use App\Models\OtpChallenge;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * ThaiBulkSMS's dedicated OTP API (not the generic SMS-send API — separate product,
 * separate auth: key/secret go in the form body, not HTTP Basic Auth).
 * https://developer.thaibulksms.com/reference/post_v2-otp-request
 * https://developer.thaibulksms.com/reference/post_v2-otp-verify
 *
 * ThaiBulkSMS generates and delivers the pin itself and hands back an opaque `token`
 * identifying the challenge — we never see or store the pin, only that token.
 */
class ThaiBulkSmsOtpProvider implements OtpProviderInterface
{
    private const BASE_URL = 'https://otp.thaibulksms.com/v2/otp';

    public function __construct(
        private readonly ?string $key,
        private readonly ?string $secret,
        private readonly ?string $sender,
    ) {}

    public function request(string $phoneE164, string $locale): array
    {
        if (! $this->key || ! $this->secret || ! $this->sender) {
            throw DomainException::of('SMS_NOT_CONFIGURED', 503);
        }

        $response = Http::asForm()->timeout(10)->post(self::BASE_URL.'/request', [
            'key' => $this->key,
            'secret' => $this->secret,
            'msisdn' => ltrim($phoneE164, '+'),
            'sender' => $this->sender,
        ]);

        if ($response->failed() || $response->json('status') !== 'success' || ! $response->json('token')) {
            Log::warning('thaibulksms_otp.request_failed', ['status' => $response->status(), 'body' => $response->json()]);
            throw DomainException::of('SMS_SEND_FAILED', 502);
        }

        return ['code_hash' => null, 'provider_token' => $response->json('token')];
    }

    public function verify(OtpChallenge $challenge, string $pin): void
    {
        $response = Http::asForm()->timeout(10)->post(self::BASE_URL.'/verify', [
            'key' => $this->key,
            'secret' => $this->secret,
            'token' => $challenge->provider_token,
            'pin' => $pin,
        ]);

        if ($response->failed()) {
            $left = max(0, config('dao.otp.max_attempts') - $challenge->attempts);
            throw DomainException::of('OTP_INVALID', 422, [], ['attempts_remaining' => $left]);
        }
    }
}
