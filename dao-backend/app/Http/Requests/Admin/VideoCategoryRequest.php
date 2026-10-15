<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class VideoCategoryRequest extends AdminRequest
{
    public function rules(): array
    {
        $id = $this->route('id');

        return array_merge([
            'slug' => [$id ? 'sometimes' : 'required', 'string', 'max:40', 'regex:/^[a-z0-9_]+$/', Rule::unique('video_categories', 'slug')->ignore($id)],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ], $this->translationRules(['name' => 'string|max:60'], ['name']));
    }
}
