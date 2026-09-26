<?php

namespace App\Jobs;

use App\Contracts\PushProviderInterface;
use App\Models\AppNotification;
use App\Models\DeviceToken;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendPushNotification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public array $backoff = [10, 60, 300];

    public function __construct(public int $notificationId) {}

    public function handle(PushProviderInterface $push): void
    {
        $notification = AppNotification::query()->find($this->notificationId);
        if (! $notification || $notification->pushed_at) {
            return;
        }
        $tokens = DeviceToken::query()->where('user_id', $notification->user_id)->pluck('token')->all();
        if ($tokens === []) {
            return;
        }
        $invalid = $push->send($tokens, $notification->title, $notification->body, array_merge($notification->data ?? [], ['notification_id' => $notification->id]));
        if ($invalid !== []) {
            DeviceToken::query()->whereIn('token', $invalid)->delete();
        }
        $notification->forceFill(['pushed_at' => now()])->save();
    }
}
