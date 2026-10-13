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
    'preorder_status' => [
        'submitted' => [
            'title' => 'Pre-order received ✦',
            'body' => 'We got pre-order :preorder. We\'ll review it shortly.',
        ],
        'in_review' => [
            'title' => 'We\'re reviewing your pre-order',
            'body' => 'Pre-order :preorder is being checked by our team.',
        ],
        'approved' => [
            'title' => 'Pre-order approved',
            'body' => 'Good news! Pre-order :preorder is approved. Payment details are coming up.',
        ],
        'rejected' => [
            'title' => 'Pre-order not approved',
            'body' => 'Sorry, pre-order :preorder couldn\'t be approved. Open it to see why.',
        ],
        'waiting_payment' => [
            'title' => 'Payment needed',
            'body' => 'Pre-order :preorder is ready for payment. Pay now to secure your items.',
        ],
        'in_process' => [
            'title' => 'Payment received',
            'body' => 'Thank you! Pre-order :preorder is now in process.',
        ],
        'waiting_courier' => [
            'title' => 'Waiting for courier',
            'body' => 'Pre-order :preorder is ready and waiting for the courier to Myanmar.',
        ],
        'in_transit' => [
            'title' => 'On its way',
            'body' => 'Pre-order :preorder is in transit to Myanmar.',
        ],
        'landed_myanmar' => [
            'title' => 'Landed in Myanmar',
            'body' => 'Pre-order :preorder has arrived in Myanmar.',
        ],
        'packaging' => [
            'title' => 'Packing your pre-order',
            'body' => 'Pre-order :preorder is being packed.',
        ],
        'on_delivery' => [
            'title' => 'Out for delivery',
            'body' => 'Pre-order :preorder is on its way to you.',
        ],
        'completed' => [
            'title' => 'Pre-order delivered ✦',
            'body' => 'Pre-order :preorder is complete. Enjoy!',
        ],
        'cancelled' => [
            'title' => 'Pre-order cancelled',
            'body' => 'Pre-order :preorder was cancelled.',
        ],
        'refunded' => [
            'title' => 'Pre-order refunded',
            'body' => 'Pre-order :preorder has been refunded.',
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
