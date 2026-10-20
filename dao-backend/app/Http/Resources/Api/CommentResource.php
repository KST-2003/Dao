<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Comment
 *
 * A banned comment is only ever serialized for its own author, so it is masked: the app shows
 * "banned" in place of the text and image.
 */
class CommentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $banned = $this->isBanned();
        $name = fn ($user) => $user?->greetingName() ?: 'DAO member';

        return [
            'id' => $this->id,
            'parent_id' => $this->parent_id,
            'status' => $this->status->value,
            'body' => $banned ? null : $this->body,
            'image_url' => $banned ? null : $this->image_url,
            'user' => ['id' => $this->user_id, 'name' => $name($this->user), 'avatar_url' => $this->user?->avatar_url],
            'reply_to' => $this->reply_to_user_id ? $name($this->replyToUser) : null,
            'like_count' => $this->like_count,
            'reply_count' => $this->reply_count,
            'is_liked' => in_array($this->id, (array) $request->attributes->get('comment_liked_ids', []), true),
            'is_mine' => $request->user('sanctum')?->id === $this->user_id,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
