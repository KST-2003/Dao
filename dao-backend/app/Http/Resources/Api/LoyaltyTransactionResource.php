<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\LoyaltyTransaction */
class LoyaltyTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'points' => $this->points,
            'balance_after' => $this->balance_after,
            'description' => $this->description,
            'reference' => $this->reference_type ? ['type' => $this->reference_type, 'id' => $this->reference_id] : null,
            'expires_at' => $this->when($this->points > 0, fn () => $this->expires_at?->toIso8601String()),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
