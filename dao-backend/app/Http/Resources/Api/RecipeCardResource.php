<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Recipe */
class RecipeCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'category' => $this->category,
            'title' => $this->translated('title'),
            // Thai name is always offered as a subtitle (e.g. "Green Curry · แกงเขียวหวาน").
            'title_th' => $this->translated('title', 'th'),
            'cover_image_url' => $this->cover_image_url,
            'total_minutes' => $this->prep_minutes + $this->cook_minutes,
            'difficulty' => $this->difficulty->value,
            'spice_level' => $this->spice_level,
            'servings' => $this->servings,
            'has_video' => $this->video_id !== null,
            'is_saved' => in_array($this->id, (array) $request->attributes->get('saved_recipe_ids', []), true),
        ];
    }
}
