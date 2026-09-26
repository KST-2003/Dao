<?php

namespace App\Http\Controllers\Admin;

use App\Enums\LoyaltyTransactionType;
use App\Http\Requests\Admin\CampaignRequest;
use App\Http\Requests\Admin\PointsAdjustRequest;
use App\Jobs\AwardCampaignPoints;
use App\Models\LoyaltyTransaction;
use App\Models\User;
use App\Services\Loyalty\LoyaltyService;
use App\Services\Loyalty\MembershipService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoyaltyController extends AdminController
{
    public function ledger(Request $request): JsonResponse
    {
        $query = LoyaltyTransaction::query()->with(['user:id,name,display_name,phone', 'admin:id,name'])
            ->when($request->filled('user_id'), fn ($q) => $q->where('user_id', $request->integer('user_id')))
            ->when($request->filled('type'), fn ($q) => $q->where('type', (string) $request->input('type')))
            ->latest('id');

        return $this->paginated($query->paginate($this->perPage()), fn (LoyaltyTransaction $t) => [
            'id' => $t->id,
            'user' => $t->user ? ['id' => $t->user->id, 'name' => $t->user->display_name ?: ($t->user->name ?: $t->user->phone)] : null,
            'type' => $t->type->value,
            'points' => $t->points,
            'balance_after' => $t->balance_after,
            'description' => $t->description,
            'reference' => $t->reference_type ? $t->reference_type.':'.$t->reference_id : null,
            'admin' => $t->admin?->name,
            'expires_at' => $t->expires_at?->toIso8601String(),
            'created_at' => $t->created_at?->toIso8601String(),
        ]);
    }

    /** Manual adjustment: reason + admin + timestamp are always recorded (ledger row + audit log). */
    public function adjust(PointsAdjustRequest $request, LoyaltyService $loyalty, MembershipService $membership): JsonResponse
    {
        $user = User::query()->findOrFail($request->integer('user_id'));
        $points = $request->integer('points');
        $reason = (string) (string) $request->input('reason');

        $tx = $points > 0
            ? $loyalty->credit($user, LoyaltyTransactionType::ManualAdjustment, $points, null, $reason, null, $this->admin())
            : $loyalty->debit($user, LoyaltyTransactionType::ManualAdjustment, abs($points), null, $reason, null, $this->admin());
        $membership->recalculate($user, 'manual_adjustment');
        $this->audit('points.adjusted', $user, ['points' => $points, 'transaction_id' => $tx?->id], $reason);

        return response()->json(['data' => $tx], 201);
    }

    public function campaign(CampaignRequest $request): JsonResponse
    {
        AwardCampaignPoints::dispatch((string) $request->input('code'), $request->integer('points'), (string) $request->input('description'), $request->input('tier_ids'), $this->admin()->id);
        $this->audit('points.campaign_queued', null, $request->validated());

        return response()->json(['data' => ['queued' => true]], 202);
    }
}
