<?php

namespace App\Services\Sms;

use App\Contracts\SmsProviderInterface;
use App\Exceptions\DomainException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * ThaiBulkSMS "Send SMS" API v2 — https://developer.thaibulksms.com/reference/post_sms-1
 * Auth: HTTP Basic (username = API key, password = API secret).
 * A 2xx response can still list the number in bad_phone_number_list, so that's checked too.
 */
class ThaiBulkSmsProvider implements SmsProviderInterface
{
    public function __construct(
        private readonly ?string $key,
        private readonly ?string $secret,
        private readonly ?string $sender,
    ) {}

    public function send(string $phoneE164, string $message): void
    {
        if (! $this->key || ! $this->secret || ! $this->sender) {
            throw DomainException::of('SMS_NOT_CONFIGURED', 503);
        }

        $response = Http::asForm()
            ->withBasicAuth($this->key, $this->secret)
            ->timeout(10)
            ->post('https://api-v2.thaibulksms.com/sms', [
                'msisdn' => $phoneE164,
                'message' => $message,
                'sender' => $this->sender,
            ]);

        $rejected = collect($response->json('bad_phone_number_list', []))->isNotEmpty();

        if ($response->failed() || $rejected) {
            Log::warning('thaibulksms.send_failed', [
                'status' => $response->status(),
                'error' => $response->json('error'),
                'bad_phone_number_list' => $response->json('bad_phone_number_list'),
            ]);
            throw DomainException::of('SMS_SEND_FAILED', 502);
        }
    }
}
