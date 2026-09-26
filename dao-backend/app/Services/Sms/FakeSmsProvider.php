<?php

namespace App\Services\Sms;

use App\Contracts\SmsProviderInterface;

/** Test double: records messages in memory. Bound only when APP_ENV=testing. */
class FakeSmsProvider implements SmsProviderInterface
{
    /** @var list<array{to: string, message: string}> */
    public array $sent = [];

    public function send(string $phoneE164, string $message): void
    {
        $this->sent[] = ['to' => $phoneE164, 'message' => $message];
    }

    public function lastCodeFor(string $phone): ?string
    {
        foreach (array_reverse($this->sent) as $sms) {
            if ($sms['to'] === $phone && preg_match('/\b(\d{6})\b/', $sms['message'], $m)) {
                return $m[1];
            }
        }

        return null;
    }
}
