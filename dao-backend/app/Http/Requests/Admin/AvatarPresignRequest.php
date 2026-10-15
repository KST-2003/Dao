<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class AvatarPresignRequest extends AdminRequest
{
    public function rules(): array
    {
        return [
            'content_type' => ['required', Rule::in(['image/jpeg', 'image/png', 'image/webp', 'image/heic'])],
            'size' => ['required', 'integer', 'min:1', 'max:'.(config('dao.uploads.image_max_kb') * 1024)],
        ];
    }
}
