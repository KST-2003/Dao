<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Review */
class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'rating' => $this->rating,
            'body' => $this->body,
            'photos' => $this->photos ?? [],
            'is_verified_purchase' => $this->is_verified_purchase,
            'status' => $this->status->value,
            'user' => ['name' => $this->user?->greetingName() ?: 'DAO member', 'avatar_url' => $this->user?->avatar_url],
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
