<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class CategoryRequest extends AdminRequest
{
    public function rules(): array
    {
        $id = $this->route('id');

        return array_merge([
            'parent_id' => ['nullable', 'integer', 'exists:categories,id', Rule::notIn([$id])],
            'slug' => [$id ? 'sometimes' : 'required', 'string', 'max:190', 'alpha_dash', Rule::unique('categories', 'slug')->ignore($id)],
            'image_url' => ['nullable', 'url', 'max:500'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ], $this->translationRules(['name' => 'string|max:190', 'description' => 'string|max:2000'], ['name']));
    }
}
