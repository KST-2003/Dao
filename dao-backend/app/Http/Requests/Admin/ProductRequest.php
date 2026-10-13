<?php

namespace App\Http\Requests\Admin;

use App\Enums\ProductBadge;
use App\Enums\ProductStatus;
use Illuminate\Validation\Rule;

class ProductRequest extends AdminRequest
{
    public function rules(): array
    {
        $id = $this->route('id');

        return array_merge([
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'slug' => ['sometimes', 'string', 'max:190', 'alpha_dash', Rule::unique('products', 'slug')->ignore($id)],
            'brand' => ['nullable', 'string', 'max:100'],
            'sku' => ['nullable', 'string', 'max:100', Rule::unique('products', 'sku')->ignore($id)],
            'barcode' => ['nullable', 'string', 'max:100'],
            'price' => [$id ? 'sometimes' : 'required', 'integer', 'min:0'],
            'sale_price' => ['nullable', 'integer', 'min:0'],
            'member_price' => ['nullable', 'integer', 'min:0'],
            'cost' => ['nullable', 'integer', 'min:0'],
            'weight_grams' => ['nullable', 'integer', 'min:0'],
            // Quantity limits; null = no limit.
            'min_order_qty' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'max_order_qty' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'preorder_enabled' => ['sometimes', 'boolean'],
            'preorder_min_qty' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'preorder_max_qty' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'preorder_capacity' => ['nullable', 'integer', 'min:1', 'max:1000000'],
            'status' => ['sometimes', Rule::enum(ProductStatus::class)],
            'badges' => ['nullable', 'array'],
            'badges.*' => [Rule::enum(ProductBadge::class)],
            'is_vip_only' => ['sometimes', 'boolean'],
            'vip_min_tier_id' => ['nullable', 'integer', 'exists:membership_tiers,id'],
            'video_url' => ['nullable', 'url', 'max:500'],
            'external_url' => ['nullable', 'url', 'max:500'],
            'social_platform' => ['nullable', Rule::in(['tiktok', 'instagram', 'facebook', 'line', 'other'])],
            'campaign_code' => ['nullable', 'string', 'max:50'],
            'published_at' => ['nullable', 'date'],
            'collection_ids' => ['sometimes', 'array'],
            'collection_ids.*' => ['integer', 'exists:collections,id'],
            'video_ids' => ['sometimes', 'array'],
            'video_ids.*' => ['integer', 'exists:videos,id'],
        ], $this->translationRules([
            'name' => 'string|max:190',
            'description' => 'string|max:5000',
            'materials' => 'string|max:2000',
            'care_instructions' => 'string|max:2000',
            'shipping_info' => 'string|max:2000',
        ], ['name']));
    }

    /** @return array<int, callable> */
    public function after(): array
    {
        return [function ($validator) {
            // min must not exceed max (only when both are given; PUT may send either alone).
            foreach ([['min_order_qty', 'max_order_qty'], ['preorder_min_qty', 'preorder_max_qty']] as [$min, $max]) {
                if ($this->filled($min) && $this->filled($max) && (int) $this->input($min) > (int) $this->input($max)) {
                    $validator->errors()->add($max, __('errors.QTY_RANGE_INVALID'));
                }
            }
            if ($this->filled('preorder_max_qty') && $this->filled('preorder_capacity') && (int) $this->input('preorder_max_qty') > (int) $this->input('preorder_capacity')) {
                $validator->errors()->add('preorder_capacity', __('errors.QTY_RANGE_INVALID'));
            }
        }];
    }
}
