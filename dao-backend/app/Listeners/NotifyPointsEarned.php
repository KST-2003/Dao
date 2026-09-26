<?php

namespace App\Listeners;

use App\Enums\NotificationType;
use App\Events\PointsEarned;
use App\Services\Notifications\NotificationService;

class NotifyPointsEarned
{
    public function __construct(private readonly NotificationService $notifications) {}

    public function handle(PointsEarned $event): void
    {
        $this->notifications->notify(
            $event->user,
            NotificationType::PointsEarned,
            'points_earned',
            ['points' => number_format($event->transaction->points)],
            ['route' => '/points', 'celebrate' => 'points'],
        );
    }
}
