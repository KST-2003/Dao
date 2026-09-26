<?php

namespace App\Services\Auth;

use App\Contracts\SocialIdentityProviderInterface;
use App\DTOs\SocialIdentity;
use App\Enums\AuthProvider;
use App\Exceptions\DomainException;
use Illuminate\Support\Facades\Http;

/** Verifies a Google ID token (from the mobile Google sign-in flow) with Google. */
class GoogleIdentityProvider implements SocialIdentityProviderInterface
{
    /** @param  list<string>  $clientIds */
    public function __construct(private readonly array $clientIds) {}

    public function isConfigured(): bool
    {
        return $this->clientIds !== [];
    }

    public function verify(array $credentials): SocialIdentity
    {
        if (! $this->isConfigured()) {
            throw DomainException::of('PROVIDER_NOT_CONFIGURED', 503);
        }

        $response = Http::timeout(10)->get('https://oauth2.googleapis.com/tokeninfo', ['id_token' => $credentials['id_token'] ?? '']);
        if ($response->failed()) {
            throw DomainException::of('INVALID_SOCIAL_TOKEN', 401);
        }

        $claims = $response->json();
        $validIssuer = in_array($claims['iss'] ?? '', ['accounts.google.com', 'https://accounts.google.com'], true);
        $validAudience = in_array($claims['aud'] ?? '', $this->clientIds, true);
        $notExpired = (int) ($claims['exp'] ?? 0) > time();

        if (! $validIssuer || ! $validAudience || ! $notExpired || empty($claims['sub'])) {
            throw DomainException::of('INVALID_SOCIAL_TOKEN', 401);
        }

        $emailVerified = filter_var($claims['email_verified'] ?? false, FILTER_VALIDATE_BOOL);

        return new SocialIdentity(
            provider: AuthProvider::Google,
            providerUserId: (string) $claims['sub'],
            email: $emailVerified ? ($claims['email'] ?? null) : null,
            emailVerified: $emailVerified,
            name: $claims['name'] ?? null,
            avatarUrl: $claims['picture'] ?? null,
        );
    }
}
