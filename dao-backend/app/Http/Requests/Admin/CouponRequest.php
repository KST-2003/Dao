<?php

namespace App\Http\Requests\Admin;

use App\Enums\CouponScope;
use App\Enums\CouponType;
use Illuminate\Validation\Rule;

class CouponRequest extends AdminRequest
{
    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'code' => [$id ? 'sometimes' : 'required', 'string', 'max:50', 'alpha_dash', Rule::unique('coupons', 'code')->ignore($id)],
            'type' => [$id ? 'sometimes' : 'required', Rule::enum(CouponType::class)],
            'value' => ['sometimes', 'integer', 'min:0'],
            'max_discount' => ['nullable', 'integer', 'min:0'],
            'min_subtotal' => ['sometimes', 'integer', 'min:0'],
            'scope' => ['sometimes', Rule::enum(CouponScope::class)],
            'min_tier_id' => ['nullable', 'integer', 'exists:membership_tiers,id'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'usage_limit_per_user' => ['nullable', 'integer', 'min:1'],
            'description' => ['nullable', 'string', 'max:190'],
            'is_active' => ['sometimes', 'boolean'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'product_ids' => ['sometimes', 'array'],
            'product_ids.*' => ['integer', 'exists:products,id'],
            'category_ids' => ['sometimes', 'array'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
        ];
    }
}
