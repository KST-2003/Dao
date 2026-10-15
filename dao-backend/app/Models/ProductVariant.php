<?php

namespace App\Models;

use App\Enums\Currency;
use App\Services\Currency\CurrencyService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A purchasable size × color combination. Stock lives here.
 *
 * @property int $id
 * @property int $stock_quantity
 */
class ProductVariant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'sku', 'size', 'color', 'color_hex', 'attributes', 'price_override', 'sale_price_override',
        'stock_quantity', 'low_stock_threshold', 'is_active', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'attributes' => 'array',
            'price_override' => 'integer',
            'sale_price_override' => 'integer',
            'stock_quantity' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class);
    }

    /** Regular (non-sale) unit price. */
    public function basePrice(): int
    {
        return $this->price_override ?? $this->product->price;
    }

    /** Price the shopper pays before any member benefit. */
    public function listPrice(): int
    {
        $sale = $this->sale_price_override ?? $this->product->sale_price;

        return ($sale !== null && $sale < $this->basePrice()) ? $sale : $this->basePrice();
    }

    /** A variant follows the product's own MMK price only if it has no THB price override of its own. */
    public function usesProductMmkPrice(): bool
    {
        return $this->price_override === null && $this->sale_price_override === null && $this->product->hasOwnMmkPrice();
    }

    public function basePriceIn(Currency $currency): int
    {
        return match (true) {
            $currency === Currency::THB => $this->basePrice(),
            $this->usesProductMmkPrice() => $this->product->priceIn($currency),
            default => app(CurrencyService::class)->fromBase($this->basePrice(), $currency),
        };
    }

    public function listPriceIn(Currency $currency): int
    {
        return match (true) {
            $currency === Currency::THB => $this->listPrice(),
            $this->usesProductMmkPrice() => $this->product->salePriceIn($currency) ?? $this->product->priceIn($currency),
            default => app(CurrencyService::class)->fromBase($this->listPrice(), $currency),
        };
    }

    public function isOnSaleIn(Currency $currency): bool
    {
        return $this->listPriceIn($currency) < $this->basePriceIn($currency);
    }

    public function isOnSale(): bool
    {
        return $this->listPrice() < $this->basePrice();
    }

    public function label(): string
    {
        return collect([$this->color, $this->size])->filter()->implode(' / ');
    }

    public function isLowStock(): bool
    {
        return $this->stock_quantity > 0 && $this->stock_quantity <= $this->low_stock_threshold;
    }
}
