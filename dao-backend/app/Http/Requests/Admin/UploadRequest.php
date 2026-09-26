<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class UploadRequest extends AdminRequest
{
    public function rules(): array
    {
        $cfg = config('dao.uploads');
        $isVideo = $this->input('kind') === 'video';

        return [
            'kind' => ['required', Rule::in(['image', 'video'])],
            'folder' => ['required', Rule::in(['products', 'collections', 'categories', 'banners', 'videos', 'thumbnails', 'recipes', 'rewards', 'tiers'])],
            'file' => $isVideo
                ? ['required', 'file', 'mimes:'.implode(',', $cfg['video_mimes']), 'mimetypes:video/mp4,video/quicktime,video/x-m4v,video/webm', 'max:'.$cfg['video_max_kb']]
                : ['required', 'file', 'image', 'mimes:'.implode(',', $cfg['image_mimes']), 'max:'.$cfg['image_max_kb'], 'dimensions:min_width=200,min_height=200,max_width=8000,max_height=8000'],
        ];
    }
}
