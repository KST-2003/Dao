<?php

namespace App\Listeners;

use App\Enums\NotificationType;
use App\Events\MembershipTierChanged;
use App\Services\Notifications\NotificationService;

class NotifyTierChanged
{
    public function __construct(private readonly NotificationService $notifications) {}

    public function handle(MembershipTierChanged $event): void
    {
        if (! $event->isUpgrade) {
            return;
        }
        $locale = $event->user->preferred_language;
        $this->notifications->notify(
            $event->user,
            NotificationType::TierUpgrade,
            'tier_upgrade',
            ['tier' => $event->to->translated('name', $locale)],
            ['route' => '/membership', 'celebrate' => 'tier_upgrade'],
        );
    }
}
