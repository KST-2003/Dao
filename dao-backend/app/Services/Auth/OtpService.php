<?php

namespace App\Services\Auth;

use App\Contracts\OtpProviderInterface;
use App\Exceptions\DomainException;
use App\Models\OtpChallenge;
use Illuminate\Support\Facades\DB;

/**
 * SMS one-time passwords: expiring, attempt-limited, resend cooldown, per-phone hourly cap
 * (per-IP limits are applied by the `otp` rate limiter on the route). Generation and pin
 * checking are delegated to OtpProviderInterface — see its docblock for why.
 */
class OtpService
{
    public function __construct(private readonly OtpProviderInterface $provider) {}

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

        $result = $this->provider->request($phone, $locale); // throws SMS_NOT_CONFIGURED | SMS_SEND_FAILED

        OtpChallenge::query()->create([
            'phone' => $phone,
            'code_hash' => $result['code_hash'],
            'provider_token' => $result['provider_token'],
            'expires_at' => now()->addSeconds($cfg['ttl_seconds']),
            'ip' => $ip,
        ]);

        return ['expires_in' => $cfg['ttl_seconds'], 'resend_in' => $cfg['resend_cooldown_seconds']];
    }

    /** Consumes the challenge on success. Throws on any failure. */
    public function verify(string $phone, string $code): void
    {
        $max = config('dao.otp.max_attempts');

        // Locally-owned bookkeeping (expiry, attempt counting) happens under a lock; the
        // provider check — possibly a network call — happens after the lock is released.
        $challenge = DB::transaction(function () use ($phone, $max): OtpChallenge {
            /** @var OtpChallenge|null $challenge */
            $challenge = OtpChallenge::query()
                ->where('phone', $phone)
                ->whereNull('consumed_at')
                ->latest('id')
                ->lockForUpdate()
                ->first();

            if (! $challenge || $challenge->expires_at->isPast()) {
                throw DomainException::of('OTP_EXPIRED', 422);
            }
            if ($challenge->attempts >= $max) {
                throw DomainException::of('OTP_TOO_MANY_ATTEMPTS', 429);
            }

            $challenge->increment('attempts');

            return $challenge;
        });

        $this->provider->verify($challenge, $code); // throws OTP_INVALID

        $challenge->forceFill(['consumed_at' => now()])->save();
    }
}
