<?php

namespace App\Services\Auth;

use App\Contracts\SocialIdentityProviderInterface;
use App\DTOs\SocialIdentity;
use App\Enums\AuthProvider;
use App\Exceptions\DomainException;
use Illuminate\Support\Facades\Http;

/**
 * LINE Login. The app sends either:
 *  - { code, code_verifier, redirect_uri } from the OAuth (PKCE) flow — exchanged here with the channel secret, or
 *  - { id_token } from the native LINE SDK.
 * The ID token is then verified with LINE. The channel secret never leaves the server.
 */
class LineIdentityProvider implements SocialIdentityProviderInterface
{
    public function __construct(
        private readonly ?string $channelId,
        private readonly ?string $channelSecret,
    ) {}

    public function isConfigured(): bool
    {
        return (bool) $this->channelId && (bool) $this->channelSecret;
    }

    public function verify(array $credentials): SocialIdentity
    {
        if (! $this->isConfigured()) {
            throw DomainException::of('PROVIDER_NOT_CONFIGURED', 503);
        }

        $idToken = $credentials['id_token'] ?? null;
        if (! $idToken) {
            $token = Http::asForm()->timeout(10)->post('https://api.line.me/oauth2/v2.1/token', [
                'grant_type' => 'authorization_code',
                'code' => $credentials['code'] ?? '',
                'redirect_uri' => $credentials['redirect_uri'] ?? '',
                'client_id' => $this->channelId,
                'client_secret' => $this->channelSecret,
                'code_verifier' => $credentials['code_verifier'] ?? '',
            ]);
            $idToken = $token->successful() ? $token->json('id_token') : null;
            if (! $idToken) {
                throw DomainException::of('INVALID_SOCIAL_TOKEN', 401);
            }
        }

        $verify = Http::asForm()->timeout(10)->post('https://api.line.me/oauth2/v2.1/verify', [
            'id_token' => $idToken,
            'client_id' => $this->channelId,
        ]);

        if ($verify->failed() || empty($verify->json('sub'))) {
            throw DomainException::of('INVALID_SOCIAL_TOKEN', 401);
        }

        $claims = $verify->json();

        return new SocialIdentity(
            provider: AuthProvider::Line,
            providerUserId: (string) $claims['sub'],
            email: $claims['email'] ?? null,
            emailVerified: isset($claims['email']),
            name: $claims['name'] ?? null,
            avatarUrl: $claims['picture'] ?? null,
        );
    }
}
