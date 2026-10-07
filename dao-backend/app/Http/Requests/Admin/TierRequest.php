<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class TierRequest extends AdminRequest
{
    public function rules(): array
    {
        $id = $this->route('id');

        return array_merge([
            'code' => [$id ? 'sometimes' : 'required', 'string', 'max:50', 'alpha_dash', Rule::unique('membership_tiers', 'code')->ignore($id)],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'min_points' => ['sometimes', 'integer', 'min:0'],
            'min_spend' => ['sometimes', 'integer', 'min:0'],
            'discount_percent' => ['sometimes', 'numeric', 'between:0,90'],
            'points_multiplier' => ['sometimes', 'numeric', 'between:0,10'],
            'free_shipping' => ['sometimes', 'boolean'],
            'early_access' => ['sometimes', 'boolean'],
            'priority_support' => ['sometimes', 'boolean'],
            'allows_screenshots' => ['sometimes', 'boolean'],
            'allows_video_download' => ['sometimes', 'boolean'],
            'badge_icon' => ['nullable', 'string', 'max:190'],
            'color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'is_active' => ['sometimes', 'boolean'],
        ], $this->translationRules(['name' => 'string|max:100', 'description' => 'string|max:2000', 'benefits' => 'array|max:12'], ['name']), [
            'translations.*.benefits.*' => ['string', 'max:190'],
        ]);
    }
}
