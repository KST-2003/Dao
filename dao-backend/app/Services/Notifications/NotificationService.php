<?php

namespace App\Services\Notifications;

use App\Enums\NotificationType;
use App\Jobs\SendPushNotification;
use App\Models\AppNotification;
use App\Models\User;

/**
 * Centralized notifications. Text is rendered in the recipient's preferred language from
 * lang/{locale}/notifications.php, stored in-app, then pushed on the queue.
 */
class NotificationService
{
    /**
     * @param  array<string, mixed>  $params  translation placeholders
     * @param  array<string, mixed>  $data  deep-link payload for the app
     */
    public function notify(User $user, NotificationType $type, string $key, array $params = [], array $data = []): AppNotification
    {
        $locale = $user->preferred_language ?: config('dao.fallback_locale');

        $notification = AppNotification::query()->create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => __("notifications.{$key}.title", $params, $locale),
            'body' => __("notifications.{$key}.body", $params, $locale),
            'data' => $data,
        ]);

        if ($user->deviceTokens()->exists()) {
            SendPushNotification::dispatch($notification->id);
        }

        return $notification;
    }

    /** Admin broadcast with already-localized text per locale. */
    public function notifyRaw(User $user, NotificationType $type, string $title, string $body, array $data = []): AppNotification
    {
        $notification = AppNotification::query()->create([
            'user_id' => $user->id, 'type' => $type, 'title' => $title, 'body' => $body, 'data' => $data,
        ]);
        if ($user->deviceTokens()->exists()) {
            SendPushNotification::dispatch($notification->id);
        }

        return $notification;
    }
}
