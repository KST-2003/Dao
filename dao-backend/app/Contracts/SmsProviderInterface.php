<?php

namespace App\Contracts;

interface SmsProviderInterface
{
    /**
     * @throws \App\Exceptions\DomainException SMS_NOT_CONFIGURED | SMS_SEND_FAILED
     */
    public function send(string $phoneE164, string $message): void;
}
