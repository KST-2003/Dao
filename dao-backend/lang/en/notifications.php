<?php

return [
    'order_status' => [
        'pending_payment' => [
            'title' => 'Order placed ✦',
            'body' => 'Order :order is waiting for payment.',
        ],
        'paid' => [
            'title' => 'Payment received',
            'body' => 'Thank you! Order :order is confirmed.',
        ],
        'processing' => [
            'title' => 'We\'re preparing your order',
            'body' => 'Order :order is being prepared with love.',
        ],
        'packing' => [
            'title' => 'Packing your order',
            'body' => 'Order :order is being packed.',
        ],
        'shipped' => [
            'title' => 'Your DAO order is on the way',
            'body' => 'Order :order has shipped.',
        ],
        'delivered' => [
            'title' => 'Delivered ✦',
            'body' => 'Order :order has arrived. Enjoy!',
        ],
        'cancelled' => [
            'title' => 'Order cancelled',
            'body' => 'Order :order was cancelled.',
        ],
        'refunded' => [
            'title' => 'Refund processed',
            'body' => 'Order :order has been refunded.',
        ],
    ],
    'points_earned' => [
        'title' => 'You earned :points DAO Points ✦',
        'body' => 'Thank you for shopping with DAO.',
    ],
    'tier_upgrade' => [
        'title' => 'Congratulations ✦',
        'body' => 'You\'ve reached :tier. New benefits are waiting for you.',
    ],
];
