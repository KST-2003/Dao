<?php

namespace App\Casts;

use App\Contracts\MediaStorageInterface;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/** Same as MediaUrl, but for a JSON array-of-keys column (e.g. Review::$photos). */
class MediaUrlList implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): array
    {
        $keys = is_string($value) ? (json_decode($value, true) ?? []) : (array) $value;

        return array_values(app(MediaStorageInterface::class)->getMediaUrls($keys));
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): string
    {
        $media = app(MediaStorageInterface::class);

        return json_encode(array_values(array_map(fn ($v) => $media->normalizeKey($v), (array) $value)));
    }
}
