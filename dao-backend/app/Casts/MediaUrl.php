<?php

namespace App\Casts;

use App\Contracts\MediaStorageInterface;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Transparent key→URL resolution: every *_url column on a media-bearing model gets this
 * cast, so models and Resources keep reading/writing `$model->image_url` exactly as before —
 * what's actually stored is a key, what's read back is a resolved URL (see
 * MediaStorageInterface::getMediaUrl for the resolution rules).
 *
 * @implements CastsAttributes<string|null, string|null>
 */
class MediaUrl implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        return app(MediaStorageInterface::class)->getMediaUrl($value);
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        return app(MediaStorageInterface::class)->normalizeKey($value);
    }
}
