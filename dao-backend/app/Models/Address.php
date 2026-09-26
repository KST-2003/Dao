<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Address extends Model
{
    use HasFactory;

    protected $fillable = [
        'label', 'recipient_name', 'phone', 'country_code', 'region', 'district', 'subdistrict',
        'city', 'postal_code', 'address_line1', 'address_line2', 'notes', 'is_default',
    ];

    protected function casts(): array
    {
        return ['is_default' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Immutable snapshot stored on orders. */
    public function toSnapshot(): array
    {
        return $this->only([
            'recipient_name', 'phone', 'country_code', 'region', 'district', 'subdistrict',
            'city', 'postal_code', 'address_line1', 'address_line2', 'notes',
        ]);
    }
}
