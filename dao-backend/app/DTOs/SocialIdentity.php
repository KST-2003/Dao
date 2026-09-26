<?php

namespace App\DTOs;

use App\Enums\AuthProvider;

final readonly class SocialIdentity
{
    public function __construct(
        public AuthProvider $provider,
        public string $providerUserId,
        public ?string $email = null,
        public bool $emailVerified = false,
        public ?string $name = null,
        public ?string $avatarUrl = null,
        public ?string $phone = null,
    ) {}
}
