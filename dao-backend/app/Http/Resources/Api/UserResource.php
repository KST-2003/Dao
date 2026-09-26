<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'display_name' => $this->display_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar_url' => $this->avatar_url,
            'preferred_language' => $this->preferred_language,
            'country' => $this->country,
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'gender' => $this->gender?->value,
            'referral_code' => $this->referral_code,
            'profile_completed' => $this->profile_completed,
            'providers' => $this->whenLoaded('authProviders', fn () => $this->authProviders->map(fn ($p) => $p->provider->value)->values()),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
