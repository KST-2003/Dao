<?php

namespace App\Http\Resources\Api;

use App\Support\Localized;
use Illuminate\Http\Request;

/** @mixin \App\Models\Recipe */
class RecipeResource extends RecipeCardResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'description' => $this->translated('description'),
            'tips' => $this->translated('tips'),
            'prep_minutes' => $this->prep_minutes,
            'cook_minutes' => $this->cook_minutes,
            'video' => $this->whenLoaded('video', fn () => $this->video ? new VideoCardResource($this->video) : null),
            'video_url' => $this->whenLoaded('video', fn () => $this->video?->video_url),
            'ingredients' => $this->ingredients->map(fn ($i) => [
                'id' => $i->id,
                'name' => Localized::pick($i->name),
                'quantity' => $i->quantity,
                'unit' => $i->unit,
                'product_id' => $i->product_id,
            ])->values(),
            'steps' => $this->steps->map(fn ($s) => [
                'number' => $s->step_number,
                'instruction' => Localized::pick($s->instruction),
                'image_url' => $s->image_url,
                'timer_seconds' => $s->timer_seconds,
            ])->values(),
        ]);
    }
}
