<?php

namespace App\Services\Loyalty;

use App\Events\MembershipTierChanged;
use App\Models\LoyaltyAccount;
use App\Models\MembershipHistory;
use App\Models\MembershipTier;
use App\Models\User;
use App\Models\UserMembership;
use Illuminate\Support\Facades\DB;

/**
 * Tier qualification is data-driven (membership_tiers). No tier names in code.
 * A tier qualifies when lifetime points OR lifetime spend reaches its threshold.
 */
class MembershipService
{
    public function entryTier(): MembershipTier
    {
        return MembershipTier::query()->active()->orderBy('sort_order')->firstOrFail();
    }

    public function ensureMembership(User $user): UserMembership
    {
        return UserMembership::query()->firstOrCreate(
            ['user_id' => $user->id],
            ['membership_tier_id' => $this->entryTier()->id, 'lifetime_spend' => 0, 'achieved_at' => now()],
        );
    }

    public function currentTier(?User $user): ?MembershipTier
    {
        if (! $user) {
            return null;
        }

        return $this->ensureMembership($user)->tier()->with('translations')->first();
    }

    public function addSpend(User $user, int $amount): void
    {
        $this->ensureMembership($user);
        UserMembership::query()->whereKey($user->id)->increment('lifetime_spend', max(0, $amount));
    }

    public function removeSpend(User $user, int $amount): void
    {
        DB::transaction(function () use ($user, $amount) {
            $m = UserMembership::query()->whereKey($user->id)->lockForUpdate()->first();
            if ($m) {
                $m->lifetime_spend = max(0, $m->lifetime_spend - $amount);
                $m->save();
            }
        });
    }

    public function recalculate(User $user, string $reason): MembershipTier
    {
        return DB::transaction(function () use ($user, $reason) {
            $this->ensureMembership($user);
            $membership = UserMembership::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            $points = (int) (LoyaltyAccount::query()->find($user->id)?->lifetime_points ?? 0);

            $target = MembershipTier::query()->active()->orderByDesc('sort_order')->get()
                ->first(fn (MembershipTier $t) => $t->isQualifiedBy($points, $membership->lifetime_spend))
                ?? $this->entryTier();

            if ($target->id !== $membership->membership_tier_id) {
                $from = $membership->tier;
                $membership->forceFill(['membership_tier_id' => $target->id, 'achieved_at' => now()])->save();
                MembershipHistory::query()->create([
                    'user_id' => $user->id,
                    'from_tier_id' => $from?->id,
                    'to_tier_id' => $target->id,
                    'reason' => $reason,
                ]);
                MembershipTierChanged::dispatch($user, $from, $target, $target->sort_order > ($from->sort_order ?? -1));
            }

            return $target;
        });
    }

    /** Everything the membership card needs. */
    public function summary(User $user): array
    {
        $membership = $this->ensureMembership($user)->load('tier.translations');
        $tier = $membership->tier;
        $account = LoyaltyAccount::query()->find($user->id);
        $points = (int) ($account?->lifetime_points ?? 0);
        $spend = $membership->lifetime_spend;

        $next = MembershipTier::query()->active()->with('translations')
            ->where('sort_order', '>', $tier->sort_order)->orderBy('sort_order')->first();

        $pointsToNext = $next && $next->min_points > 0 ? max(0, $next->min_points - $points) : null;
        $spendToNext = $next && $next->min_spend > 0 ? max(0, $next->min_spend - $spend) : null;

        $progress = 1.0;
        if ($next) {
            $ratios = [];
            if ($next->min_points > 0) {
                $ratios[] = min(1, max(0, ($points - $tier->min_points) / max(1, $next->min_points - $tier->min_points)));
            }
            if ($next->min_spend > 0) {
                $ratios[] = min(1, max(0, ($spend - $tier->min_spend) / max(1, $next->min_spend - $tier->min_spend)));
            }
            $progress = $ratios === [] ? 0.0 : max($ratios);
        }

        return [
            'tier' => $tier,
            'next_tier' => $next,
            'balance' => (int) ($account?->balance ?? 0),
            'lifetime_points' => $points,
            'lifetime_spend' => $spend,
            'points_to_next' => $pointsToNext,
            'spend_to_next' => $spendToNext,
            'progress' => round($progress, 4),
            'member_since' => $user->created_at,
        ];
    }
}
