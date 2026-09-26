<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Collection */
class CollectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->translated('name'),
            'subtitle' => $this->translated('subtitle'),
            'description' => $this->translated('description'),
            'hero_image_url' => $this->hero_image_url,
            'is_vip_only' => $this->is_vip_only,
            'ends_at' => $this->ends_at?->toIso8601String(),
            'products' => ProductCardResource::collection($this->whenLoaded('products')),
        ];
    }
}
