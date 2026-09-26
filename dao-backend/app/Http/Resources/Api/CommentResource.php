<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Comment */
class CommentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'parent_id' => $this->parent_id,
            'body' => $this->body,
            'user' => ['name' => $this->user?->greetingName() ?: 'DAO member', 'avatar_url' => $this->user?->avatar_url],
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
