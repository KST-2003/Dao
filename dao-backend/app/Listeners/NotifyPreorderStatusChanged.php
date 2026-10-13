<?php

namespace App\Listeners;

use App\Enums\NotificationType;
use App\Events\PreorderStatusChanged;
use App\Services\Notifications\NotificationService;

class NotifyPreorderStatusChanged
{
    public function __construct(private readonly NotificationService $notifications) {}

    public function handle(PreorderStatusChanged $event): void
    {
        $preorder = $event->preorder;
        $this->notifications->notify(
            $preorder->user,
            NotificationType::OrderUpdate,
            'preorder_status.'.$event->to->value,
            ['preorder' => $preorder->preorder_number],
            ['route' => '/preorders/'.$preorder->id],
        );
    }
}
