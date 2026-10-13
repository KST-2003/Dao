<?php

namespace App\Listeners;

use App\Enums\NotificationType;
use App\Events\OrderStatusChanged;
use App\Services\Notifications\NotificationService;

class NotifyOrderStatusChanged
{
    public function __construct(private readonly NotificationService $notifications) {}

    public function handle(OrderStatusChanged $event): void
    {
        $order = $event->order;
        if ($order->preorder_id !== null) {
            return; // the pre-order's own notifications cover it
        }
        $this->notifications->notify(
            $order->user,
            NotificationType::OrderUpdate,
            'order_status.'.$event->to->value,
            ['order' => $order->order_number],
            ['route' => '/orders/'.$order->id],
        );
    }
}
