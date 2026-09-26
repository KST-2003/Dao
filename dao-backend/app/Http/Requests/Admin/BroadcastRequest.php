<?php

namespace App\Http\Requests\Admin;

use App\Enums\NotificationType;
use Illuminate\Validation\Rule;

class BroadcastRequest extends AdminRequest
{
    public function rules(): array
    {
        $fallback = config('dao.fallback_locale');

        return [
            'type' => ['required', Rule::enum(NotificationType::class)],
            'content' => ['required', 'array'],
            "content.{$fallback}.title" => ['required', 'string', 'max:120'],
            "content.{$fallback}.body" => ['required', 'string', 'max:500'],
            'content.*.title' => ['nullable', 'string', 'max:120'],
            'content.*.body' => ['nullable', 'string', 'max:500'],
            'tier_ids' => ['nullable', 'array'],
            'tier_ids.*' => ['integer', 'exists:membership_tiers,id'],
            'route' => ['nullable', 'string', 'max:190', 'regex:/^\//'],
        ];
    }
}
