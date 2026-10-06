<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\CouponRequest;
use App\Models\Coupon;
use App\Models\CouponRedemption;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CouponController extends AdminController
{
    public function index(Request $request): JsonResponse
    {
        $query = Coupon::query()->whereNull('user_id') // personal reward coupons are listed per customer
            ->when($request->filled('q'), fn ($q) => $q->where('code', 'like', $this->like((string) $request->input('q'))))
            ->latest('id');

        return $this->paginated($query->paginate($this->perPage()), fn (Coupon $c) => $this->present($c));
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => $this->present(Coupon::query()->findOrFail($id), true)]);
    }

    public function store(CouponRequest $request): JsonResponse
    {
        $coupon = DB::transaction(function () use ($request) {
            $coupon = Coupon::query()->create($request->safe()->except(['product_ids', 'category_ids']));
            $coupon->products()->sync($request->input('product_ids', []));
            $coupon->categories()->sync($request->input('category_ids', []));

            return $coupon;
        });
        $this->audit('coupon.created', $coupon);

        return response()->json(['data' => $this->present($coupon, true)], 201);
    }

    public function update(CouponRequest $request, int $id): JsonResponse
    {
        $coupon = Coupon::query()->findOrFail($id);
        DB::transaction(function () use ($request, $coupon) {
            $coupon->fill($request->safe()->except(['product_ids', 'category_ids']))->save();
            if ($request->has('product_ids')) {
                $coupon->products()->sync($request->input('product_ids'));
            }
            if ($request->has('category_ids')) {
                $coupon->categories()->sync($request->input('category_ids'));
            }
        });
        $this->audit('coupon.updated', $coupon, $request->validated());

        return response()->json(['data' => $this->present($coupon->fresh(), true)]);
    }

    public function redemptions(int $id): JsonResponse
    {
        Coupon::query()->findOrFail($id);
        $query = CouponRedemption::query()->where('coupon_id', $id)->with(['user', 'order'])->latest('id');

        return $this->paginated($query->paginate($this->perPage()), fn (CouponRedemption $r) => [
            'id' => $r->id,
            'customer' => ['id' => $r->user->id, 'name' => $r->user->display_name ?? $r->user->name, 'phone' => $r->user->phone, 'email' => $r->user->email],
            'order' => ['id' => $r->order_id, 'number' => $r->order->order_number],
            'discount_amount' => $r->discount_amount,
            'redeemed_at' => $r->created_at->toIso8601String(),
            'released_at' => $r->released_at?->toIso8601String(),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $coupon = Coupon::query()->findOrFail($id);
        $coupon->forceFill(['is_active' => false])->save(); // deactivate: redemptions keep their history
        $this->audit('coupon.deactivated', $coupon);

        return response()->json(['data' => ['deactivated' => true]]);
    }

    private function present(Coupon $c, bool $detail = false): array
    {
        $data = array_merge($c->attributesToArray(), ['type' => $c->type->value, 'scope' => $c->scope->value]);
        if ($detail) {
            $data['product_ids'] = $c->products()->pluck('products.id');
            $data['category_ids'] = $c->categories()->pluck('categories.id');
        }

        return $data;
    }
}
