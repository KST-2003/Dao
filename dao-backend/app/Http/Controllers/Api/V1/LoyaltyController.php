<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\CouponResource;
use App\Http\Resources\Api\LoyaltyTransactionResource;
use App\Http\Resources\Api\MembershipTierResource;
use App\Http\Resources\Api\RewardResource;
use App\Models\Coupon;
use App\Models\MembershipTier;
use App\Models\Reward;
use App\Services\Loyalty\MembershipService;
use App\Services\Loyalty\RewardService;
use App\Services\Settings\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LoyaltyController extends Controller
{
    public function points(Request $request, MembershipService $membership, SettingsService $settings): JsonResponse
    {
        $user = $request->user();
        $summary = $membership->summary($user);
        $expiring = $user->loyaltyTransactions()->where('remaining', '>', 0)->whereNotNull('expires_at')
            ->where('expires_at', '<', now()->addDays(30))->sum('remaining');
        $ledger = $user->loyaltyTransactions()->latest('id')->paginate(20);

        return LoyaltyTransactionResource::collection($ledger)->additional(['meta' => [
            'balance' => $summary['balance'],
            'lifetime_points' => $summary['lifetime_points'],
            'expiring_within_30_days' => (int) $expiring,
            'redeem' => [
                'points_unit' => $settings->int('loyalty.redeem_points_unit'),
                'value_per_unit' => $settings->int('loyalty.redeem_value_per_unit'),
                'min_points' => $settings->int('loyalty.redeem_min_points'),
            ],
        ]])->response();
    }

    public function membership(Request $request, MembershipService $membership): JsonResponse
    {
        $summary = $membership->summary($request->user());
        $tiers = MembershipTier::query()->active()->with('translations')->orderBy('sort_order')->get();

        return $this->ok([
            'tier' => new MembershipTierResource($summary['tier']),
            'next_tier' => $summary['next_tier'] ? new MembershipTierResource($summary['next_tier']) : null,
            'balance' => $summary['balance'],
            'lifetime_points' => $summary['lifetime_points'],
            'lifetime_spend' => $summary['lifetime_spend'],
            'points_to_next' => $summary['points_to_next'],
            'spend_to_next' => $summary['spend_to_next'],
            'progress' => $summary['progress'],
            'member_since' => $summary['member_since']?->toIso8601String(),
            'tiers' => MembershipTierResource::collection($tiers),
        ]);
    }

    public function rewards(): AnonymousResourceCollection
    {
        return RewardResource::collection(Reward::query()->available()->with(['translations', 'minTier.translations'])->orderBy('points_cost')->get());
    }

    public function redeemReward(Request $request, int $id, RewardService $rewards): JsonResponse
    {
        $redemption = $rewards->redeem($request->user(), Reward::query()->findOrFail($id));

        return $this->ok([
            'redemption_id' => $redemption->id,
            'status' => $redemption->status,
            'coupon' => $redemption->coupon ? new CouponResource($redemption->coupon) : null,
        ], 201);
    }

    public function coupons(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $coupons = Coupon::query()->where('is_active', true)
            ->where(fn ($q) => $q->where('user_id', $user->id))
            ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
            ->whereDoesntHave('redemptions', fn ($q) => $q->where('user_id', $user->id)->whereNull('released_at'))
            ->latest()->get();

        return CouponResource::collection($coupons);
    }

    public function referral(Request $request, SettingsService $settings): JsonResponse
    {
        $user = $request->user();

        return $this->ok([
            'code' => $user->referral_code,
            'referrer_bonus' => $settings->int('referral.referrer_bonus'),
            'referee_bonus' => $settings->int('referral.referee_bonus'),
            'min_order_total' => $settings->int('referral.min_order_total'),
            'referred_count' => \App\Models\Referral::query()->where('referrer_user_id', $user->id)->count(),
            'rewarded_count' => \App\Models\Referral::query()->where('referrer_user_id', $user->id)->where('status', 'rewarded')->count(),
        ]);
    }
}
