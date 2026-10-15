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
            'is_liked' => $request->attributes->has('video_liked_ids')
                ? in_array($this->id, (array) $request->attributes->get('video_liked_ids'), true)
                : (bool) $request->attributes->get('video_is_liked', false),
            // The admin who published it — their profile name and picture ("Dao" for videos with no author).
            'author' => ['name' => $this->author?->name ?: 'Dao', 'avatar_url' => $this->author?->avatar_url],
        ]);
    }
}
