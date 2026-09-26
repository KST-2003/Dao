<?php

return [
    // DAO uses bearer tokens only (mobile) and an httpOnly cookie that carries a
    // bearer token (admin). No session-based SPA auth, so nothing is stateful.
    'stateful' => [],
    'guard' => [],
    // Per-token expiry is set when the token is created (see TokenIssuer).
    'expiration' => null,
    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', 'dao_'),
    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
        'validate_csrf_token' => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ],
];
