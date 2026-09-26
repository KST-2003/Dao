<?php

namespace App\Jobs;

use App\Enums\LoyaltyTransactionType;
use App\Models\AdminUser;
use App\Models\User;
use App\Services\Loyalty\LoyaltyService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Queue\Queueable;

/** Bulk campaign bonus. Idempotent per (campaign code, user), so re-running never double-awards. */
class AwardCampaignPoints implements ShouldQueue
{
    use Queueable;

    public int $timeout = 900;

    /** @param  list<int>|null  $tierIds */
    public function __construct(
        public string $code,
        public int $points,
        public string $description,
        public ?array $tierIds,
        public int $adminId,
    ) {}

    public function handle(LoyaltyService $loyalty): void
    {
        $admin = AdminUser::query()->find($this->adminId);
        User::query()
            ->when($this->tierIds, fn (Builder $q) => $q->whereHas('membership', fn (Builder $m) => $m->whereIn('membership_tier_id', $this->tierIds)))
            ->chunkById(500, function ($users) use ($loyalty, $admin) {
                foreach ($users as $user) {
                    $loyalty->credit($user, LoyaltyTransactionType::CampaignBonus, $this->points, null, $this->description,
                        "campaign:{$this->code}:user:{$user->id}", $admin);
                }
            });
    }
}
