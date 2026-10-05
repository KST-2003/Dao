<?php

namespace App\Models;

use App\Casts\MediaUrl;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductImage extends Model
{
    protected $fillable = ['url', 'thumbnail_url', 'alt', 'color', 'sort_order'];

    protected function casts(): array
    {
        return ['url' => MediaUrl::class, 'thumbnail_url' => MediaUrl::class];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
