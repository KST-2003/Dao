<?php

namespace App\Services\Sms;

use App\Contracts\SmsProviderInterface;
use App\Exceptions\DomainException;

/** Bound when no SMS provider is configured. Never pretends an SMS was sent. */
class UnconfiguredSmsProvider implements SmsProviderInterface
{
    public function send(string $phoneE164, string $message): void
    {
        throw DomainException::of('SMS_NOT_CONFIGURED', 503);
    }
}
