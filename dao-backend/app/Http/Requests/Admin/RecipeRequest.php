<?php

namespace App\Http\Requests\Admin;

use App\Enums\Difficulty;
use App\Enums\PublishStatus;
use Illuminate\Validation\Rule;

class RecipeRequest extends AdminRequest
{
    public function rules(): array
    {
        $id = $this->route('id');

        return array_merge([
            'video_id' => ['nullable', 'integer', 'exists:videos,id'],
            'slug' => [$id ? 'sometimes' : 'required', 'string', 'max:190', 'alpha_dash', Rule::unique('recipes', 'slug')->ignore($id)],
            'category' => ['nullable', 'string', 'max:40'],
            'cover_image_url' => ['nullable', 'url', 'max:500'],
            'prep_minutes' => ['sometimes', 'integer', 'min:0', 'max:1440'],
            'cook_minutes' => ['sometimes', 'integer', 'min:0', 'max:1440'],
            'servings' => ['sometimes', 'integer', 'min:1', 'max:50'],
            'difficulty' => ['sometimes', Rule::enum(Difficulty::class)],
            'spice_level' => ['sometimes', 'integer', 'between:0,3'],
            'is_featured' => ['sometimes', 'boolean'],
            'status' => ['sometimes', Rule::enum(PublishStatus::class)],
            'published_at' => ['nullable', 'date'],
            'ingredients' => ['sometimes', 'array', 'max:60'],
            'ingredients.*.name' => ['required', 'array'],
            'ingredients.*.name.'.config('dao.fallback_locale') => ['required', 'string', 'max:190'],
            'ingredients.*.name.*' => ['nullable', 'string', 'max:190'],
            'ingredients.*.quantity' => ['nullable', 'string', 'max:30'],
            'ingredients.*.unit' => ['nullable', 'string', 'max:30'],
            'ingredients.*.product_id' => ['nullable', 'integer', 'exists:products,id'],
            'steps' => ['sometimes', 'array', 'max:40'],
            'steps.*.instruction' => ['required', 'array'],
            'steps.*.instruction.'.config('dao.fallback_locale') => ['required', 'string', 'max:2000'],
            'steps.*.instruction.*' => ['nullable', 'string', 'max:2000'],
            'steps.*.image_url' => ['nullable', 'url', 'max:500'],
            'steps.*.timer_seconds' => ['nullable', 'integer', 'min:0'],
        ], $this->translationRules(['title' => 'string|max:190', 'description' => 'string|max:5000', 'tips' => 'string|max:2000'], ['title']));
    }
}
