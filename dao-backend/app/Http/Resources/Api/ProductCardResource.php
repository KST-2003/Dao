<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Compact product for grids/carousels. Prices in minor units.
 * `is_saved` uses the saved-id list the controller puts on the request (no N+1).
 *
 * @mixin \App\Models\Product
 */
class ProductCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $variants = $this->relationLoaded('variants') ? $this->variants->where('is_active', true) : collect();
        $onSale = $this->sale_price !== null && $this->sale_price < $this->price;
        $image = $this->relationLoaded('images') ? $this->images->first() : null;

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->translated('name'),
            'brand' => $this->brand,
            'image_url' => $image?->url,
            'thumbnail_url' => $image?->thumbnail_url ?? $image?->url,
            'currency' => $this->currency,
            'price' => $this->price,
            'sale_price' => $onSale ? $this->sale_price : null,
            'discount_percent' => $onSale ? (int) round((1 - $this->sale_price / max(1, $this->price)) * 100) : null,
            'member_price' => $this->member_price,
            'badges' => $this->badges ?? [],
            'is_vip_only' => $this->is_vip_only,
            'rating_avg' => $this->rating_avg,
            'rating_count' => $this->rating_count,
            'in_stock' => $variants->contains(fn ($v) => $v->stock_quantity > 0),
            'colors' => $variants->whereNotNull('color')->unique('color')->map(fn ($v) => ['name' => $v->color, 'hex' => $v->color_hex])->values(),
            'is_saved' => in_array($this->id, (array) $request->attributes->get('saved_product_ids', []), true),
        ];
    }
}
