<?php

namespace App\Models;

use App\Enums\ReviewStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    protected $fillable = ['product_id', 'user_id', 'order_item_id', 'rating', 'body', 'photos', 'is_verified_purchase', 'status'];

    protected function casts(): array
    {
        return [
            'status' => ReviewStatus::class,
            'photos' => 'array',
            'rating' => 'integer',
            'is_verified_purchase' => 'boolean',
            'moderated_at' => 'datetime',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
