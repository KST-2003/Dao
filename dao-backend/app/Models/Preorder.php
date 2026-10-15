<?php

namespace App\Models;

use App\Enums\PreorderDestination;
use App\Enums\PreorderStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $preorder_number
 * @property PreorderStatus $status
 * @property PreorderDestination $destination
 * @property int $subtotal
 * @property int $member_discount
 * @property int $shipping_fee
 * @property int $grand_total
 * @property int|null $order_id
 */
class Preorder extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'status' => PreorderStatus::class,
            'destination' => PreorderDestination::class,
            'exchange_rate' => 'float',
            'subtotal' => 'integer',
            'member_discount' => 'integer',
            'shipping_fee' => 'integer',
            'grand_total' => 'integer',
            'shipping_address' => 'array',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'paid_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PreorderItem::class);
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(PreorderStatusHistory::class)->orderBy('id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
