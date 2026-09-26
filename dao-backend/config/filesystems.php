<?php

// Merged on top of the framework defaults (local, public, s3 disks stay available).
return [
    'default' => env('FILESYSTEM_DISK', 'public'),

    'disks' => [
        // Cloudflare R2 (S3-compatible). Set FILESYSTEM_DISK=r2 in production.
        'r2' => [
            'driver' => 's3',
            'key' => env('R2_ACCESS_KEY_ID'),
            'secret' => env('R2_SECRET_ACCESS_KEY'),
            'region' => 'auto',
            'bucket' => env('R2_BUCKET'),
            'endpoint' => env('R2_ENDPOINT'),
            'url' => env('R2_PUBLIC_URL'),
            'use_path_style_endpoint' => true,
            'throw' => true,
        ],
    ],

    'r2_public_url' => env('R2_PUBLIC_URL', ''),
];
