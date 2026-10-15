<?php

namespace App\Http\Resources\Api;

use App\Models\Product;
use App\Services\Currency\CurrencyService;
use App\Services\Orders\PreorderService;
use Illuminate\Http\Request;

/**
 * Product detail. `pricing` (member price for this shopper) is attached by the controller.
 *
 * @mixin Product
 */
class ProductResource extends ProductCardResource
{
    public function toArray(Request $request): array
    {
        $currency = app(CurrencyService::class)->current();

        return array_merge(parent::toArray($request), [
            'description' => $this->translated('description'),
            'materials' => $this->translated('materials'),
            'care_instructions' => $this->translated('care_instructions'),
            'shipping_info' => $this->translated('shipping_info'),
            'video_url' => $this->video_url,
            'external_url' => $this->external_url,
            'category' => $this->whenLoaded('category', fn () => $this->category ? ['slug' => $this->category->slug, 'name' => $this->category->translated('name')] : null),
            'images' => $this->images->map(fn ($i) => ['id' => $i->id, 'url' => $i->url, 'thumbnail_url' => $i->thumbnail_url, 'alt' => $i->alt, 'color' => $i->color])->values(),
            'variants' => $this->variants->where('is_active', true)->map(fn ($v) => $v->setRelation('product', $this->resource))->map(fn ($v) => [
                'id' => $v->id,
                'sku' => $v->sku,
                'size' => $v->size,
                'color' => $v->color,
                'color_hex' => $v->color_hex,
                'price' => $v->basePriceIn($currency),
                'list_price' => $v->listPriceIn($currency),
                'stock_status' => $v->stock_quantity <= 0 ? 'out_of_stock' : ($v->isLowStock() ? 'low_stock' : 'in_stock'),
                // Exact stock only when low ("Only 2 left"), to avoid leaking inventory levels.
                'stock_left' => $v->isLowStock() ? $v->stock_quantity : null,
                'attributes' => $v->attributes ?? (object) [],
            ])->values(),
            'sizes' => $this->variants->where('is_active', true)->pluck('size')->filter()->unique()->values(),
            'pricing' => $request->attributes->get('product_pricing'),
            // Admin-set limits; null = unlimited.
            'min_order_qty' => $this->min_order_qty,
            'max_order_qty' => $this->max_order_qty,
            'preorder' => [
                'enabled' => (bool) $this->preorder_enabled,
                'min_qty' => $this->preorder_min_qty,
                'max_qty' => $this->preorder_max_qty,
                'remaining' => $this->preorder_enabled && $this->preorder_capacity !== null
                    ? max(0, $this->preorder_capacity - app(PreorderService::class)->committedQuantity($this->id))
                    : null,
            ],
            // "Watch Dao's review" — the inverse of a video's "Shop this look" (same product_video pivot).
            'videos' => VideoCardResource::collection($this->whenLoaded('videos')),
        ]);
    }
}
