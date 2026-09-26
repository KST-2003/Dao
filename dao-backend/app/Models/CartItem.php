<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CartItem extends Model
{
    protected $fillable = ['product_variant_id', 'quantity', 'saved_for_later', 'unit_price_at_add'];

    protected function casts(): array
    {
        return ['quantity' => 'integer', 'saved_for_later' => 'boolean', 'unit_price_at_add' => 'integer'];
    }

    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id')->withTrashed();
    }
}
