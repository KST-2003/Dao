<?php

namespace App\Http\Requests\Admin;

use App\Enums\InventoryReason;
use Illuminate\Validation\Rule;

class InventoryAdjustRequest extends AdminRequest
{
    public function rules(): array
    {
        return [
            'variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'change' => ['required', 'integer', 'not_in:0', 'between:-100000,100000'],
            'reason' => ['required', Rule::in([InventoryReason::Restock->value, InventoryReason::Adjustment->value, InventoryReason::Damaged->value])],
            'note' => ['required', 'string', 'max:500'],
        ];
    }
}
