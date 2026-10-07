<?php

namespace App\Http\Requests\Admin;

use App\Enums\ContentType;
use App\Enums\PublishStatus;
use Illuminate\Validation\Rule;

class VideoRequest extends AdminRequest
{
    /**
     * Tags drive filtering and "related videos" (see Api\V1\VideoController), so free-typed
     * variants ("Egg", "egg ", "egg") must collapse to one before they ever reach the DB.
     */
    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();
        if ($this->has('tags')) {
            $this->merge(['tags' => collect((array) $this->input('tags'))
                ->map(fn ($tag) => trim(mb_strtolower((string) $tag)))
                ->filter()
                ->unique()
                ->values()
                ->all(),
            ]);
        }
    }

    public function rules(): array
    {
        $id = $this->route('id');

        return array_merge([
            'content_type' => [$id ? 'sometimes' : 'required', Rule::enum(ContentType::class)],
            'category' => ['nullable', 'string', 'max:40'],
            'slug' => [$id ? 'sometimes' : 'required', 'string', 'max:190', 'alpha_dash', Rule::unique('videos', 'slug')->ignore($id)],
            'thumbnail_url' => ['nullable', 'string', 'max:500'],
            'video_url' => ['nullable', 'string', 'max:500'],
            'duration_seconds' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', Rule::enum(PublishStatus::class)],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:40'],
            'is_members_only' => ['sometimes', 'boolean'],
            'published_at' => ['nullable', 'date'],
            'products' => ['sometimes', 'array'],
            'products.*.id' => ['required', 'integer', 'exists:products,id'],
            'products.*.timestamp_seconds' => ['nullable', 'integer', 'min:0'],
        ], $this->translationRules(['title' => 'string|max:190', 'description' => 'string|max:5000'], ['title']));
    }
}
