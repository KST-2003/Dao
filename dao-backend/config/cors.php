<?php

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    // Only the admin dashboard is a browser client. The mobile app is not subject to CORS.
    'allowed_origins' => array_values(array_filter([env('ADMIN_URL')])),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With', 'X-Locale', 'Accept-Language', 'Idempotency-Key'],
    'exposed_headers' => [],
    'max_age' => 3600,
    'supports_credentials' => true,
];
