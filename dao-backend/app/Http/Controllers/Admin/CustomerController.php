<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PaymentStatus;
use App\Http\Requests\Admin\CustomerContentAccessRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Customer records. Never exposes tokens, OTP hashes or provider secrets — only which providers are linked. */
class CustomerController extends AdminController
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query()->with(['membership.tier.translations', 'loyaltyAccount'])
            ->withCount('orders')
            ->withSum(['orders as total_spent' => fn ($q) => $q->where('payment_status', PaymentStatus::Succeeded->value)], 'grand_total')
            ->when($request->filled('q'), fn ($q) => $q->where(fn ($w) => $w
                ->where('name', 'like', $this->like((string) $request->input('q')))
                ->orWhere('display_name', 'like', $this->like((string) $request->input('q')))
                ->orWhere('email', 'like', $this->like((string) $request->input('q')))
                ->orWhere('phone', 'like', $this->like((string) $request->input('q')))))
            ->when($request->filled('tier_id'), fn ($q) => $q->whereHas('membership', fn ($m) => $m->where('membership_tier_id', $request->integer('tier_id'))))
            ->latest('id');

        return $this->paginated($query->paginate($this->perPage()), fn (User $u) => $this->row($u));
    }

    public function show(int $id): JsonResponse
    {
        $user = User::query()->with(['membership.tier.translations', 'loyaltyAccount', 'authProviders', 'addresses', 'referrer:id,name,display_name,referral_code'])
            ->withCount('orders')
            ->withSum(['orders as total_spent' => fn ($q) => $q->where('payment_status', PaymentStatus::Succeeded->value)], 'grand_total')
            ->findOrFail($id);

        return response()->json(['data' => array_merge($this->row($user), [
            'date_of_birth' => $user->date_of_birth?->toDateString(),
            'gender' => $user->gender?->value,
            'country' => $user->country,
            'providers' => $user->authProviders->map(fn ($p) => ['provider' => $p->provider->value, 'linked_at' => $p->created_at?->toIso8601String()]),
            'addresses' => $user->addresses,
            'referred_by' => $user->referrer?->only(['id', 'display_name', 'referral_code']),
            'recent_orders' => $user->orders()->latest('placed_at')->limit(10)->get(['id', 'order_number', 'status', 'grand_total', 'placed_at']),
            'lifetime_spend' => $user->membership?->lifetime_spend ?? 0,
            'screenshot_override' => $user->screenshot_override,
            'download_override' => $user->download_override,
        ])]);
    }

    /**
     * Independent of the customer's membership tier — a per-user grant for cases a tier
     * rule shouldn't decide (staff QA accounts, press, partners). See ContentAccessService.
     * Not exposed through mass assignment (not in $fillable): set explicitly here only.
     */
    public function updateContentAccess(CustomerContentAccessRequest $request, int $id): JsonResponse
    {
        $user = User::query()->findOrFail($id);
        if ($request->has('screenshot_override')) {
            $user->screenshot_override = $request->boolean('screenshot_override');
        }
        if ($request->has('download_override')) {
            $user->download_override = $request->boolean('download_override');
        }
        $user->save();
        $this->audit('customer.content_access_updated', $user, $request->only(['screenshot_override', 'download_override']));

        return response()->json(['data' => [
            'screenshot_override' => $user->screenshot_override,
            'download_override' => $user->download_override,
        ]]);
    }

    private function row(User $u): array
    {
        return [
            'id' => $u->id,
            'name' => $u->display_name ?: $u->name,
            'phone' => $u->phone,
            'email' => $u->email,
            'language' => $u->preferred_language,
            'tier' => $u->membership?->tier?->translated('name'),
            'points' => (int) ($u->loyaltyAccount?->balance ?? 0),
            'orders_count' => (int) $u->orders_count,
            'total_spent' => (int) ($u->total_spent ?? 0),
            'referral_code' => $u->referral_code,
            'registered_at' => $u->created_at?->toIso8601String(),
            'last_active_at' => $u->last_active_at?->toIso8601String(),
            'deleted' => $u->trashed(),
        ];
    }
}
