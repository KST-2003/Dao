<?php

namespace App\Jobs;

use App\Enums\NotificationType;
use App\Models\User;
use App\Services\Notifications\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Queue\Queueable;

/** Admin campaign: localized title/body per locale, optional tier segment. */
class SendBroadcastNotification implements ShouldQueue
{
    use Queueable;

    public int $timeout = 900;

    /**
     * @param  array<string, array{title: string, body: string}>  $content  keyed by locale
     * @param  list<int>|null  $tierIds
     */
    public function __construct(
        public string $type,
        public array $content,
        public ?array $tierIds = null,
        public array $data = [],
    ) {}

    public function handle(NotificationService $notifications): void
    {
        $fallback = $this->content[config('dao.fallback_locale')] ?? reset($this->content);

        User::query()
            ->when($this->tierIds, fn (Builder $q) => $q->whereHas('membership', fn (Builder $m) => $m->whereIn('membership_tier_id', $this->tierIds)))
            ->chunkById(500, function ($users) use ($notifications, $fallback) {
                foreach ($users as $user) {
                    $text = $this->content[$user->preferred_language] ?? $fallback;
                    if (empty($text['title'])) {
                        $text = $fallback;
                    }
                    $notifications->notifyRaw($user, NotificationType::from($this->type), $text['title'], $text['body'], $this->data);
                }
            });
    }
}
