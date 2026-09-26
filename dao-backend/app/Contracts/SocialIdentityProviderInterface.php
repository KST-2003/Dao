<?php

namespace App\Contracts;

use App\DTOs\SocialIdentity;

interface SocialIdentityProviderInterface
{
    public function isConfigured(): bool;

    /**
     * Verify credentials server-side with the provider and return the identity.
     *
     * @param  array<string, string>  $credentials
     *
     * @throws \App\Exceptions\DomainException INVALID_SOCIAL_TOKEN | PROVIDER_NOT_CONFIGURED
     */
    public function verify(array $credentials): SocialIdentity;
}
