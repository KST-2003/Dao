<?php

namespace App\Services\Sms;

use App\Contracts\SmsProviderInterface;
use Illuminate\Support\Facades\Log;

/**
 * LOCAL DEVELOPMENT ONLY. Writes the OTP to the log instead of sending an SMS.
 * AppServiceProvider refuses to bind this outside APP_ENV=local.
 */
class LogSmsProvider implements SmsProviderInterface
{
    public function send(string $phoneE164, string $message): void
    {
        Log::info('[DEV SMS — not sent] '.$phoneE164.': '.$message);
    }
}
