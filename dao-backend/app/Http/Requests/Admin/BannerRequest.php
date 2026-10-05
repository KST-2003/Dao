<?php

namespace App\Http\Requests\Admin;

use App\Enums\BannerPlacement;
use Illuminate\Validation\Rule;

class BannerRequest extends AdminRequest
{
    public function rules(): array
    {
        $id = $this->route('id');

        return array_merge([
            'placement' => [$id ? 'sometimes' : 'required', Rule::enum(BannerPlacement::class)],
            'image_url' => [$id ? 'sometimes' : 'required', 'string', 'max:500'],
            'link_type' => ['nullable', Rule::in(['product', 'collection', 'category', 'video', 'recipe', 'url'])],
            'link_value' => ['nullable', 'string', 'max:500'],
            'theme' => ['sometimes', Rule::in(['botanical', 'midnight'])],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
        ], $this->translationRules(['eyebrow' => 'string|max:60', 'title' => 'string|max:120', 'subtitle' => 'string|max:190', 'cta_label' => 'string|max:40']));
    }
}
