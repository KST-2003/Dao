<?php

namespace App\Http\Requests\Admin;


class ShipmentRequest extends AdminRequest
{
    public function rules(): array
    {
        return [
            'carrier' => ['nullable', 'string', 'max:50'],
            'tracking_number' => ['nullable', 'string', 'max:100'],
            'tracking_url' => ['nullable', 'url', 'max:500'],
        ];
    }
}
