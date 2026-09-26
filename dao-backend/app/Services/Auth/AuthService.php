<?php

namespace App\Services\Auth;

use App\DTOs\AuthResult;
use App\DTOs\SocialIdentity;
use App\Enums\AuthProvider;
use App\Enums\LoyaltyTransactionType;
use App\Events\UserRegistered;
use App\Exceptions\DomainException;
use App\Models\User;
use App\Models\UserAuthProvider;
use App\Services\Loyalty\LoyaltyService;
use App\Services\Loyalty\MembershipService;
use App\Services\Loyalty\ReferralService;
use App\Services\Settings\SettingsService;
use Illuminate\Support\Facades\DB;

/**
 * Account resolution for Google / LINE / SMS.
 *
 * Identity = (provider, provider_user_id). Accounts are NEVER merged automatically by email or
 * phone (that would allow account takeover). A signed-in user links extra providers explicitly
 * via linkProvider(), so SMS + Google + LINE all point to one account.
 */
class AuthService
{
    public function __construct(
        private readonly MembershipService $membership,
        private readonly LoyaltyService $loyalty,
        private readonly ReferralService $referrals,
        private readonly SettingsService $settings,
    ) {}

    public function login(SocialIdentity $identity, ?string $referralCode, string $deviceName, string $locale): AuthResult
    {
        [$user, $isNew] = DB::transaction(function () use ($identity, $referralCode, $locale) {
            $link = UserAuthProvider::query()
                ->where('provider', $identity->provider->value)
                ->where('provider_user_id', $identity->providerUserId)
                ->lockForUpdate()
                ->first();

            if ($link) {
                $user = User::withTrashed()->findOrFail($link->user_id);
                if ($user->trashed()) {
                    throw DomainException::of('ACCOUNT_DISABLED', 403);
                }
                $link->forceFill(['last_used_at' => now()])->save();

                return [$user, false];
            }

            // SMS: a phone that already belongs to an account is that account's SMS identity.
            if ($identity->provider === AuthProvider::Sms && $identity->phone) {
                $existing = User::query()->where('phone', $identity->phone)->first();
                if ($existing) {
                    $existing->authProviders()->create([
                        'provider' => AuthProvider::Sms, 'provider_user_id' => $identity->providerUserId, 'last_used_at' => now(),
                    ]);

                    return [$existing, false];
                }
            }

            $user = User::query()->create([
                'name' => $identity->name,
                'display_name' => $identity->name,
                'email' => $this->freeEmail($identity->email),
                'phone' => $identity->phone,
                'avatar_url' => $identity->avatarUrl,
                'preferred_language' => $locale,
            ]);
            $user->authProviders()->create([
                'provider' => $identity->provider,
                'provider_user_id' => $identity->providerUserId,
                'email' => $identity->email,
                'last_used_at' => now(),
            ]);

            $this->onRegistered($user, $referralCode);

            return [$user, true];
        });

        return new AuthResult($user->fresh(), $this->issueToken($user, $deviceName), $isNew);
    }

    public function linkProvider(User $user, SocialIdentity $identity): UserAuthProvider
    {
        return DB::transaction(function () use ($user, $identity) {
            $taken = UserAuthProvider::query()
                ->where('provider', $identity->provider->value)
                ->where('provider_user_id', $identity->providerUserId)
                ->first();
            if ($taken && $taken->user_id !== $user->id) {
                throw DomainException::of('PROVIDER_ALREADY_LINKED', 409);
            }
            if ($taken) {
                return $taken;
            }
            if ($user->authProviders()->where('provider', $identity->provider->value)->exists()) {
                throw DomainException::of('PROVIDER_ALREADY_ON_ACCOUNT', 409);
            }

            if ($identity->provider === AuthProvider::Sms && $identity->phone) {
                if (User::query()->where('phone', $identity->phone)->whereKeyNot($user->id)->exists()) {
                    throw DomainException::of('PHONE_IN_USE', 409);
                }
                $user->forceFill(['phone' => $identity->phone])->save();
            }
            if (! $user->email && $identity->email && $identity->emailVerified) {
                $user->forceFill(['email' => $this->freeEmail($identity->email)])->save();
            }

            return $user->authProviders()->create([
                'provider' => $identity->provider,
                'provider_user_id' => $identity->providerUserId,
                'email' => $identity->email,
                'last_used_at' => now(),
            ]);
        });
    }

    public function unlinkProvider(User $user, AuthProvider $provider): void
    {
        DB::transaction(function () use ($user, $provider) {
            $links = $user->authProviders()->lockForUpdate()->get();
            if ($links->count() <= 1) {
                throw DomainException::of('LAST_PROVIDER', 422);
            }
            $user->authProviders()->where('provider', $provider->value)->delete();
        });
    }

    public function issueToken(User $user, string $deviceName): string
    {
        $ttl = (int) config('dao.customer.token_ttl_days');

        return $user->createToken(
            'mobile:'.substr($deviceName, 0, 60),
            ['customer'],
            $ttl > 0 ? now()->addDays($ttl) : null,
        )->plainTextToken;
    }

    /** Account deletion (App Store requirement). Personal data is removed, orders are kept for accounting. */
    public function deleteAccount(User $user): void
    {
        DB::transaction(function () use ($user) {
            $user->tokens()->delete();
            $user->authProviders()->delete();
            $user->deviceTokens()->delete();
            $user->addresses()->delete();
            $user->forceFill([
                'name' => null, 'display_name' => null, 'email' => null, 'phone' => null,
                'avatar_url' => null, 'date_of_birth' => null,
            ])->save();
            $user->delete();
        });
    }

    private function onRegistered(User $user, ?string $referralCode): void
    {
        $this->membership->ensureMembership($user);

        $bonus = $this->settings->int('loyalty.signup_bonus');
        if ($bonus > 0) {
            $this->loyalty->credit($user, LoyaltyTransactionType::SignupBonus, $bonus, null, 'Welcome to DAO', "signup_bonus:user:{$user->id}");
        }

        $this->referrals->attach($user, $referralCode);
        UserRegistered::dispatch($user);
    }

    private function freeEmail(?string $email): ?string
    {
        if (! $email) {
            return null;
        }

        return User::withTrashed()->where('email', $email)->exists() ? null : $email;
    }
}
