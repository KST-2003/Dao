<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;

/** @mixin \App\Models\Video */
class VideoResource extends VideoCardResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'description' => $this->translated('description'),
            // Members-only videos: the URL is withheld from guests (the app shows a sign-in prompt).
            'video_url' => $this->is_members_only && ! $request->user('sanctum') ? null : $this->video_url,
            'tags' => $this->tags ?? [],
            'shop_the_look' => ProductCardResource::collection($this->whenLoaded('products')),
            'is_liked' => (bool) $request->attributes->get('video_is_liked', false),
            'author' => ['name' => 'Dao', 'avatar_url' => null],
        ]);
    }
}
