<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class UploadRequest extends AdminRequest
{
    private const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

    private const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];

    public function rules(): array
    {
        $cfg = config('dao.uploads');
        $isVideo = $this->input('kind') === 'video';
        $maxBytes = ($isVideo ? $cfg['video_max_kb'] : $cfg['image_max_kb']) * 1024;

        return [
            'kind' => ['required', Rule::in(['image', 'video'])],
            // 'products' isn't here: product photos go through the per-product /products/{id}/images/presign
            // endpoint instead, so the key can be scoped to that specific product.
            'folder' => ['required', Rule::in(['collections', 'categories', 'banners', 'videos', 'thumbnails', 'recipes', 'rewards', 'tiers'])],
            'content_type' => ['required', Rule::in($isVideo ? self::VIDEO_TYPES : self::IMAGE_TYPES)],
            'size' => ['required', 'integer', 'min:1', 'max:'.$maxBytes],
        ];
    }
}
