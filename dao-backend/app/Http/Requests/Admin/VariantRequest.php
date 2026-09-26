<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class VariantRequest extends AdminRequest
{
    public function rules(): array
    {
        $variantId = $this->route('variantId');

        return [
            'sku' => [$variantId ? 'sometimes' : 'required', 'string', 'max:100', Rule::unique('product_variants', 'sku')->ignore($variantId)],
            'size' => ['nullable', 'string', 'max:30'],
            'color' => ['nullable', 'string', 'max:50'],
            'color_hex' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'attributes' => ['nullable', 'array'],
            'price_override' => ['nullable', 'integer', 'min:0'],
            'sale_price_override' => ['nullable', 'integer', 'min:0'],
            'low_stock_threshold' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            // Initial stock only on create; later changes go through inventory adjustments (audited).
            'initial_stock' => ['sometimes', 'integer', 'min:0', 'max:100000'],
        ];
    }
}
