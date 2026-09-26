<?php

namespace App\Services\Sms;

use App\Contracts\SmsProviderInterface;
use App\Exceptions\DomainException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TwilioSmsProvider implements SmsProviderInterface
{
    public function __construct(
        private readonly ?string $sid,
        private readonly ?string $token,
        private readonly ?string $from,
    ) {}

    public function send(string $phoneE164, string $message): void
    {
        if (! $this->sid || ! $this->token || ! $this->from) {
            throw DomainException::of('SMS_NOT_CONFIGURED', 503);
        }

        $response = Http::asForm()
            ->withBasicAuth($this->sid, $this->token)
            ->timeout(10)
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$this->sid}/Messages.json", [
                'To' => $phoneE164,
                'From' => $this->from,
                'Body' => $message,
            ]);

        if ($response->failed()) {
            Log::warning('twilio.send_failed', ['status' => $response->status(), 'code' => $response->json('code')]);
            throw DomainException::of('SMS_SEND_FAILED', 502);
        }
    }
}
