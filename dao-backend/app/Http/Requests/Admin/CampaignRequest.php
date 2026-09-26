<?php

namespace App\Http\Requests\Admin;


class CampaignRequest extends AdminRequest
{
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:50', 'alpha_dash'],
            'points' => ['required', 'integer', 'min:1', 'max:100000'],
            'description' => ['required', 'string', 'max:190'],
            'tier_ids' => ['nullable', 'array'],
            'tier_ids.*' => ['integer', 'exists:membership_tiers,id'],
        ];
    }
}
