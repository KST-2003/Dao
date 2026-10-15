<?php

namespace App\Http\Resources\Api;

use App\Services\Currency\CurrencyService;
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
        $currency = app(CurrencyService::class)->current();
        $price = $this->priceIn($currency);
        $salePrice = $this->salePriceIn($currency);
        $onSale = $salePrice !== null;
        $image = $this->relationLoaded('images') ? $this->images->first() : null;

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->translated('name'),
            'brand' => $this->brand,
            'image_url' => $image?->url,
            'thumbnail_url' => $image?->thumbnail_url ?? $image?->url,
            'currency' => $currency->value,
            'price' => $price,
            'sale_price' => $salePrice,
            'discount_percent' => $onSale ? (int) round((1 - $salePrice / max(1, $price)) * 100) : null,
            'member_price' => $this->memberPriceIn($currency),
            'badges' => array_values(array_unique(array_merge($this->badges ?? [], $this->preorder_enabled ? ['preorder'] : []))),
            'is_vip_only' => $this->is_vip_only,
            'rating_avg' => $this->rating_avg,
            'rating_count' => $this->rating_count,
            'preorder_enabled' => (bool) $this->preorder_enabled,
            'in_stock' => $variants->contains(fn ($v) => $v->stock_quantity > 0),
            'colors' => $variants->whereNotNull('color')->unique('color')->map(fn ($v) => ['name' => $v->color, 'hex' => $v->color_hex])->values(),
            'is_saved' => in_array($this->id, (array) $request->attributes->get('saved_product_ids', []), true),
        ];
    }
}
