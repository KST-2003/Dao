<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class CollectionRequest extends AdminRequest
{
    public function rules(): array
    {
        $id = $this->route('id');

        return array_merge([
            'slug' => [$id ? 'sometimes' : 'required', 'string', 'max:190', 'alpha_dash', Rule::unique('collections', 'slug')->ignore($id)],
            'hero_image_url' => ['nullable', 'url', 'max:500'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_published' => ['sometimes', 'boolean'],
            'is_featured' => ['sometimes', 'boolean'],
            'is_vip_only' => ['sometimes', 'boolean'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'product_ids' => ['sometimes', 'array'],
            'product_ids.*' => ['integer', 'exists:products,id'],
        ], $this->translationRules(['name' => 'string|max:190', 'subtitle' => 'string|max:190', 'description' => 'string|max:2000'], ['name']));
    }
}
