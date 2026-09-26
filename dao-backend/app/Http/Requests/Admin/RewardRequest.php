<?php

namespace App\Http\Requests\Admin;

use App\Enums\RewardType;
use Illuminate\Validation\Rule;

class RewardRequest extends AdminRequest
{
    public function rules(): array
    {
        $id = $this->route('id');

        return array_merge([
            'code' => [$id ? 'sometimes' : 'required', 'string', 'max:50', 'alpha_dash', Rule::unique('rewards', 'code')->ignore($id)],
            'type' => [$id ? 'sometimes' : 'required', Rule::enum(RewardType::class)],
            'points_cost' => [$id ? 'sometimes' : 'required', 'integer', 'min:1'],
            'value' => ['sometimes', 'integer', 'min:0'],
            'value_type' => ['sometimes', Rule::in(['fixed', 'percent'])],
            'min_subtotal' => ['sometimes', 'integer', 'min:0'],
            'min_tier_id' => ['nullable', 'integer', 'exists:membership_tiers,id'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'coupon_valid_days' => ['sometimes', 'integer', 'min:1', 'max:365'],
            'image_url' => ['nullable', 'url', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
        ], $this->translationRules(['name' => 'string|max:190', 'description' => 'string|max:2000'], ['name']));
    }
}
