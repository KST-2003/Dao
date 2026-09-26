<?php

/*
|--------------------------------------------------------------------------
| DAO platform configuration
|--------------------------------------------------------------------------
| Business rules that admins can change at runtime (point rates, tiers,
| shipping fees…) live in the `settings` / `membership_tiers` tables, NOT here.
| This file only holds infrastructure defaults and the seeds for those settings.
*/

return [
    'locales' => ['en', 'th', 'my'],
    'fallback_locale' => 'en',
    'default_currency' => 'THB',

    'admin' => [
        'url' => env('ADMIN_URL', 'http://localhost:5173'),
        'cookie' => 'dao_admin_token',
        'cookie_domain' => env('ADMIN_COOKIE_DOMAIN') ?: null,
        'token_ttl_minutes' => (int) env('ADMIN_TOKEN_TTL_MINUTES', 480),
    ],

    'customer' => [
        'token_ttl_days' => (int) env('CUSTOMER_TOKEN_TTL_DAYS', 90),
    ],

    'otp' => [
        'length' => 6,
        'ttl_seconds' => 300,
        'max_attempts' => 5,
        'resend_cooldown_seconds' => 60,
        'max_requests_per_phone_per_hour' => 5,
    ],

    'sms' => [
        'driver' => env('SMS_DRIVER'),
    ],

    'payments' => [
        'methods' => array_values(array_filter(array_map('trim', explode(',', (string) env('PAYMENT_METHODS', 'cod,bank_transfer'))))),
    ],

    'uploads' => [
        'image_max_kb' => 10 * 1024,
        'video_max_kb' => 100 * 1024,
        'image_mimes' => ['jpg', 'jpeg', 'png', 'webp', 'heic'],
        'video_mimes' => ['mp4', 'mov', 'm4v', 'webm'],
    ],

    /*
    | Defaults written to the `settings` table by SettingsSeeder.
    | Money values are in minor units (satang). Admins edit these in the dashboard.
    */
    'default_settings' => [
        'loyalty.signup_bonus' => 100,
        'loyalty.earn_spend_unit' => 10000,        // every ฿100 spent …
        'loyalty.earn_points_per_unit' => 1,       // … earns 1 DAO Point
        'loyalty.review_bonus' => 20,
        'loyalty.photo_review_bonus' => 30,
        'loyalty.birthday_bonus' => 200,
        'loyalty.redeem_points_unit' => 100,       // 100 points …
        'loyalty.redeem_value_per_unit' => 1000,   // … = ฿10 discount
        'loyalty.redeem_min_points' => 100,
        'loyalty.redeem_max_percent' => 50,        // points cover at most 50% of the order
        'loyalty.expiry_months' => 12,             // 0 = never expire
        'referral.referrer_bonus' => 200,
        'referral.referee_bonus' => 100,
        'referral.min_order_total' => 50000,       // referee's first paid order ≥ ฿500 qualifies
        'shipping.standard_fee' => 5000,
        'shipping.express_fee' => 10000,
        'shipping.free_threshold' => 100000,
        'payments.bank_transfer' => [
            'bank_name' => '',
            'account_name' => '',
            'account_number' => '',
            'promptpay_id' => '',
        ],
    ],
];
