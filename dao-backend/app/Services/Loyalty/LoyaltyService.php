<?php

namespace App\Services\Loyalty;

use App\Enums\LoyaltyTransactionType as Type;
use App\Events\PointsEarned;
use App\Exceptions\DomainException;
use App\Models\AdminUser;
use App\Models\LoyaltyAccount;
use App\Models\LoyaltyTransaction;
use App\Models\MembershipTier;
use App\Models\Order;
use App\Models\User;
use App\Services\Settings\SettingsService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * DAO Points ledger.
 *
 * Invariants:
 *  - loyalty_transactions is append-only; the only mutable column is `remaining` (FIFO lots).
 *  - loyalty_accounts.balance == SUM(loyalty_transactions.points) (checked by dao:points:reconcile).
 *  - SUM(remaining) == max(0, balance).
 *  - Every automatic award carries an idempotency key, so retries never double-award.
 *  - Balance may go negative ONLY through refund_reversal (earn → spend → refund must not be free points).
 */
class LoyaltyService
{
    public function __construct(private readonly SettingsService $settings) {}

    public function balance(User $user): int
    {
        return (int) (LoyaltyAccount::query()->find($user->id)?->balance ?? 0);
    }

    public function lifetimePoints(User $user): int
    {
        return (int) (LoyaltyAccount::query()->find($user->id)?->lifetime_points ?? 0);
    }

    /** Returns null when the idempotency key was already applied. */
    public function credit(
        User $user,
        Type $type,
        int $points,
        ?Model $reference = null,
        ?string $description = null,
        ?string $idempotencyKey = null,
        ?AdminUser $admin = null,
    ): ?LoyaltyTransaction {
        if ($points <= 0) {
            throw new \InvalidArgumentException('Credit points must be positive.');
        }

        return DB::transaction(function () use ($user, $type, $points, $reference, $description, $idempotencyKey, $admin) {
            if ($idempotencyKey && LoyaltyTransaction::query()->where('idempotency_key', $idempotencyKey)->exists()) {
                return null;
            }
            $account = $this->lockAccount($user);
            $newBalance = $account->balance + $points;
            $months = $this->settings->int('loyalty.expiry_months');

            $tx = LoyaltyTransaction::query()->create([
                'user_id' => $user->id,
                'type' => $type,
                'points' => $points,
                'balance_after' => $newBalance,
                // If the account was in debt, the credit repays the debt first.
                'remaining' => max(0, min($points, $newBalance)),
                'expires_at' => $months > 0 ? now()->addMonths($months) : null,
                'reference_type' => $reference?->getMorphClass(),
                'reference_id' => $reference?->getKey(),
                'description' => $description,
                'admin_user_id' => $admin?->id,
                'idempotency_key' => $idempotencyKey,
            ]);

            $account->balance = $newBalance;
            if ($type->countsTowardLifetime()) {
                $account->lifetime_points += $points;
            }
            $account->save();

            return $tx;
        });
    }

    /** Returns null when the idempotency key was already applied. */
    public function debit(
        User $user,
        Type $type,
        int $points,
        ?Model $reference = null,
        ?string $description = null,
        ?string $idempotencyKey = null,
        ?AdminUser $admin = null,
        bool $allowNegative = false,
    ): ?LoyaltyTransaction {
        if ($points <= 0) {
            throw new \InvalidArgumentException('Debit points must be positive.');
        }

        return DB::transaction(function () use ($user, $type, $points, $reference, $description, $idempotencyKey, $admin, $allowNegative) {
            if ($idempotencyKey && LoyaltyTransaction::query()->where('idempotency_key', $idempotencyKey)->exists()) {
                return null;
            }
            $account = $this->lockAccount($user);
            if (! $allowNegative && $account->balance < $points) {
                throw DomainException::of('POINTS_INSUFFICIENT', 422, [], ['balance' => $account->balance]);
            }

            $this->consumeLots($user, $points);
            $newBalance = $account->balance - $points;

            $tx = LoyaltyTransaction::query()->create([
                'user_id' => $user->id,
                'type' => $type,
                'points' => -$points,
                'balance_after' => $newBalance,
                'remaining' => 0,
                'reference_type' => $reference?->getMorphClass(),
                'reference_id' => $reference?->getKey(),
                'description' => $description,
                'admin_user_id' => $admin?->id,
                'idempotency_key' => $idempotencyKey,
            ]);

            $account->balance = $newBalance;
            if ($type === Type::RefundReversal) {
                $account->lifetime_points = max(0, $account->lifetime_points - $points);
            }
            $account->save();

            return $tx;
        });
    }

    /** Points a purchase of $eligibleSpend would earn for this tier (used for previews and awards). */
    public function purchasePoints(int $eligibleSpend, ?MembershipTier $tier): int
    {
        $unit = max(1, $this->settings->int('loyalty.earn_spend_unit'));
        $per = $this->settings->int('loyalty.earn_points_per_unit');
        $base = intdiv(max(0, $eligibleSpend), $unit) * $per;
        $multiplier = $tier ? (float) $tier->points_multiplier : 1.0;

        return (int) floor($base * max(0, $multiplier));
    }

    /** Called only after the backend has confirmed payment (OrderPaid). Never from client input. */
    public function awardPurchase(Order $order, ?MembershipTier $tier): ?LoyaltyTransaction
    {
        $points = $this->purchasePoints($order->eligibleSpend(), $tier);
        if ($points <= 0) {
            return null;
        }

        $tx = $this->credit(
            $order->user, Type::PurchaseEarned, $points, $order,
            'Order '.$order->order_number, "purchase_earned:order:{$order->id}",
        );

        if ($tx) {
            $order->forceFill(['points_earned' => $points])->save();
            PointsEarned::dispatch($order->user, $tx);
        }

        return $tx;
    }

    public function redeemForOrder(User $user, int $points, Order $order): void
    {
        $this->debit($user, Type::Redeemed, $points, $order, 'Order '.$order->order_number, "redeemed:order:{$order->id}");
    }

    /** Cancel/refund: give back points the customer spent on this order. */
    public function returnRedeemedPoints(Order $order): void
    {
        if ($order->points_redeemed > 0) {
            $this->credit(
                $order->user, Type::RedemptionReversal, $order->points_redeemed, $order,
                'Order '.$order->order_number, "redemption_reversal:order:{$order->id}",
            );
        }
    }

    /** Refund: reverse the points this order earned. Original rows are kept for audit. */
    public function reverseForRefund(Order $order): void
    {
        $earned = LoyaltyTransaction::query()->where('idempotency_key', "purchase_earned:order:{$order->id}")->first();
        if ($earned) {
            $this->debit(
                $order->user, Type::RefundReversal, $earned->points, $order,
                'Refund '.$order->order_number, "refund_reversal:order:{$order->id}", allowNegative: true,
            );
        }
    }

    /**
     * Validate a redemption request against the configured rules and return the discount (minor units).
     *
     * @throws DomainException
     */
    public function discountForPoints(User $user, int $points, int $payableBeforePoints): int
    {
        if ($points <= 0) {
            return 0;
        }
        $unit = max(1, $this->settings->int('loyalty.redeem_points_unit'));
        $valuePerUnit = $this->settings->int('loyalty.redeem_value_per_unit');
        $min = $this->settings->int('loyalty.redeem_min_points');
        $maxPercent = $this->settings->int('loyalty.redeem_max_percent');

        if ($points < $min) {
            throw DomainException::of('POINTS_BELOW_MINIMUM', 422, ['min' => $min], ['min_points' => $min]);
        }
        if ($points % $unit !== 0) {
            throw DomainException::of('POINTS_INVALID_STEP', 422, ['step' => $unit], ['step' => $unit]);
        }
        $balance = $this->balance($user);
        if ($points > $balance) {
            throw DomainException::of('POINTS_INSUFFICIENT', 422, [], ['balance' => $balance]);
        }

        $discount = intdiv($points, $unit) * $valuePerUnit;
        $maxDiscount = intdiv($payableBeforePoints * $maxPercent, 100);
        if ($discount > $maxDiscount) {
            $maxPoints = $valuePerUnit > 0 ? intdiv($maxDiscount, $valuePerUnit) * $unit : 0;
            throw DomainException::of('POINTS_EXCEED_LIMIT', 422, ['percent' => $maxPercent], ['max_points' => $maxPoints]);
        }

        return $discount;
    }

    /** Expire unspent lots whose expires_at has passed. Returns number of users affected. */
    public function expireDueLots(): int
    {
        $userIds = LoyaltyTransaction::query()
            ->where('remaining', '>', 0)->whereNotNull('expires_at')->where('expires_at', '<', now())
            ->distinct()->pluck('user_id');

        foreach ($userIds as $userId) {
            DB::transaction(function () use ($userId) {
                $account = LoyaltyAccount::query()->whereKey($userId)->lockForUpdate()->firstOrFail();
                $lots = LoyaltyTransaction::query()
                    ->where('user_id', $userId)->where('remaining', '>', 0)
                    ->whereNotNull('expires_at')->where('expires_at', '<', now())
                    ->lockForUpdate()->get();
                $total = (int) $lots->sum('remaining');
                if ($total <= 0) {
                    return;
                }
                foreach ($lots as $lot) {
                    $lot->forceFill(['remaining' => 0])->save();
                }
                $account->balance -= $total;
                $account->save();
                LoyaltyTransaction::query()->create([
                    'user_id' => $userId,
                    'type' => Type::Expired,
                    'points' => -$total,
                    'balance_after' => $account->balance,
                    'remaining' => 0,
                    'description' => 'Points expired',
                ]);
            });
        }

        return $userIds->count();
    }

    /**
     * Compare cached balances with the ledger. Fixes the cache and returns the mismatches.
     *
     * @return list<array{user_id: int, cached: int, ledger: int}>
     */
    public function reconcile(): array
    {
        $mismatches = [];
        $sums = LoyaltyTransaction::query()->selectRaw('user_id, SUM(points) as total')->groupBy('user_id')->pluck('total', 'user_id');

        LoyaltyAccount::query()->chunkById(500, function ($accounts) use ($sums, &$mismatches) {
            foreach ($accounts as $account) {
                $ledger = (int) ($sums[$account->user_id] ?? 0);
                if ($ledger !== $account->balance) {
                    $mismatches[] = ['user_id' => $account->user_id, 'cached' => $account->balance, 'ledger' => $ledger];
                    $account->forceFill(['balance' => $ledger])->save();
                }
            }
        }, 'user_id');

        return $mismatches;
    }

    private function lockAccount(User $user): LoyaltyAccount
    {
        LoyaltyAccount::query()->firstOrCreate(['user_id' => $user->id], ['balance' => 0, 'lifetime_points' => 0]);

        return LoyaltyAccount::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
    }

    /** FIFO: soonest-expiring lots first, non-expiring last. */
    private function consumeLots(User $user, int $points): void
    {
        $lots = LoyaltyTransaction::query()
            ->where('user_id', $user->id)->where('remaining', '>', 0)
            ->orderByRaw('CASE WHEN expires_at IS NULL THEN 1 ELSE 0 END')->orderBy('expires_at')->orderBy('id')
            ->lockForUpdate()->get();

        $left = $points;
        foreach ($lots as $lot) {
            if ($left <= 0) {
                break;
            }
            $take = min($lot->remaining, $left);
            $lot->forceFill(['remaining' => $lot->remaining - $take])->save();
            $left -= $take;
        }
    }
}
