<?php

namespace App\Services\Auth;

use App\Contracts\SmsProviderInterface;
use App\Exceptions\DomainException;
use App\Models\OtpChallenge;
use Illuminate\Support\Facades\DB;

/**
 * SMS one-time passwords: hashed at rest, expiring, attempt-limited, resend cooldown,
 * per-phone hourly cap (per-IP limits are applied by the `otp` rate limiter on the route).
 */
class OtpService
{
    public function __construct(private readonly SmsProviderInterface $sms) {}

    /** @return array{expires_in: int, resend_in: int} */
    public function request(string $phone, ?string $ip, string $locale): array
    {
        $cfg = config('dao.otp');

        $latest = OtpChallenge::query()->where('phone', $phone)->latest('id')->first();
        if ($latest && $latest->created_at->gt(now()->subSeconds($cfg['resend_cooldown_seconds']))) {
            $wait = $cfg['resend_cooldown_seconds'] - (int) $latest->created_at->diffInSeconds(now(), true);
            throw DomainException::of('OTP_COOLDOWN', 429, ['seconds' => max(1, $wait)], ['retry_after' => max(1, $wait)]);
        }

        $recent = OtpChallenge::query()->where('phone', $phone)->where('created_at', '>', now()->subHour())->count();
        if ($recent >= $cfg['max_requests_per_phone_per_hour']) {
            throw DomainException::of('OTP_RATE_LIMITED', 429);
        }

        $code = str_pad((string) random_int(0, 10 ** $cfg['length'] - 1), $cfg['length'], '0', STR_PAD_LEFT);

        $challenge = OtpChallenge::query()->create([
            'phone' => $phone,
            'code_hash' => $this->hash($phone, $code),
            'expires_at' => now()->addSeconds($cfg['ttl_seconds']),
            'ip' => $ip,
        ]);

        try {
            $this->sms->send($phone, __('auth.otp_sms', ['code' => $code, 'minutes' => intdiv($cfg['ttl_seconds'], 60)], $locale));
        } catch (\Throwable $e) {
            $challenge->delete(); // do not count a message that was never sent
            throw $e;
        }

        return ['expires_in' => $cfg['ttl_seconds'], 'resend_in' => $cfg['resend_cooldown_seconds']];
    }

    /** Consumes the challenge on success. Throws on any failure. */
    public function verify(string $phone, string $code): void
    {
        $max = config('dao.otp.max_attempts');

        $error = DB::transaction(function () use ($phone, $code, $max): ?DomainException {
            /** @var OtpChallenge|null $challenge */
            $challenge = OtpChallenge::query()
                ->where('phone', $phone)
                ->whereNull('consumed_at')
                ->latest('id')
                ->lockForUpdate()
                ->first();

            if (! $challenge || $challenge->expires_at->isPast()) {
                return DomainException::of('OTP_EXPIRED', 422);
            }
            if ($challenge->attempts >= $max) {
                return DomainException::of('OTP_TOO_MANY_ATTEMPTS', 429);
            }

            $challenge->increment('attempts');

            if (! hash_equals($challenge->code_hash, $this->hash($phone, $code))) {
                $left = max(0, $max - $challenge->attempts);

                return DomainException::of('OTP_INVALID', 422, [], ['attempts_remaining' => $left]);
            }

            $challenge->forceFill(['consumed_at' => now()])->save();

            return null;
        });

        if ($error) {
            throw $error; // thrown outside the transaction so the attempt counter is persisted
        }
    }

    private function hash(string $phone, string $code): string
    {
        return hash_hmac('sha256', $phone.'|'.$code, (string) config('app.key'));
    }
}
