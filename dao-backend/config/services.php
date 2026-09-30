<?php

return [
    'google' => [
        // Accept ID tokens issued for any of our OAuth clients (iOS, Android, Web).
        'client_ids' => array_values(array_filter(array_map('trim', explode(',', (string) env('GOOGLE_CLIENT_IDS', ''))))),
    ],

    'line' => [
        'channel_id' => env('LINE_CHANNEL_ID'),
        'channel_secret' => env('LINE_CHANNEL_SECRET'),
    ],

    'thaibulksms' => [
        'key' => env('THAIBULKSMS_KEY'),
        'secret' => env('THAIBULKSMS_SECRET'),
        'sender' => env('THAIBULKSMS_SENDER'),
    ],

    'stripe' => [
        'secret' => env('STRIPE_SECRET_KEY'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
        'success_url' => env('STRIPE_SUCCESS_URL', 'dao://checkout/success'),
        'cancel_url' => env('STRIPE_CANCEL_URL', 'dao://checkout/cancel'),
    ],

    'expo' => [
        'access_token' => env('EXPO_PUSH_ACCESS_TOKEN'),
    ],
];
