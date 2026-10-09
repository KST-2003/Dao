<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Address */
class AddressResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return $this->only([
            'id', 'label', 'recipient_name', 'phone', 'country_code', 'region', 'district', 'subdistrict',
            'city', 'postal_code', 'address_line1', 'address_line2', 'notes', 'is_default',
        ]) + [
            'latitude' => $this->latitude === null ? null : (float) $this->latitude,
            'longitude' => $this->longitude === null ? null : (float) $this->longitude,
        ];
    }
}
