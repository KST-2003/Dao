<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Reward */
class RewardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'type' => $this->type->value,
            'name' => $this->translated('name'),
            'description' => $this->translated('description'),
            'points_cost' => $this->points_cost,
            'value' => $this->value,
            'value_type' => $this->value_type,
            'min_subtotal' => $this->min_subtotal,
            'image_url' => $this->image_url,
            'min_tier' => $this->minTier?->translated('name'),
            'stock' => $this->stock,
            'ends_at' => $this->ends_at?->toIso8601String(),
        ];
    }
}
