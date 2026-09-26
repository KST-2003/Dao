<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Video */
class VideoCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'content_type' => $this->content_type->value,
            'category' => $this->category,
            'title' => $this->translated('title'),
            'thumbnail_url' => $this->thumbnail_url,
            'duration_seconds' => $this->duration_seconds,
            'view_count' => $this->view_count,
            'like_count' => $this->like_count,
            'comment_count' => $this->comment_count,
            'is_members_only' => $this->is_members_only,
            'published_at' => $this->published_at?->toIso8601String(),
            'is_saved' => in_array($this->id, (array) $request->attributes->get('saved_video_ids', []), true),
        ];
    }
}
