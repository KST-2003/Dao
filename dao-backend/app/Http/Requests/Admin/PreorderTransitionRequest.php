<?php

namespace App\Http\Requests\Admin;

use App\Enums\PreorderStatus;
use Illuminate\Validation\Rule;

class PreorderTransitionRequest extends AdminRequest
{
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(PreorderStatus::class)],
            // Doubles as the customer-facing reason when rejecting (required then).
            'note' => ['nullable', 'string', 'max:500', 'required_if:status,rejected'],
            // Only used when moving to waiting_payment (minor units).
            'shipping_fee' => ['nullable', 'integer', 'min:0'],
            'carrier' => ['nullable', 'string', 'max:50'],
            'tracking_number' => ['nullable', 'string', 'max:100'],
        ];
    }
}
