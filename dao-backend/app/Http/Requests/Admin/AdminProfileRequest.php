<?php

namespace App\Http\Requests\Admin;

class AdminProfileRequest extends AdminRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            // Only a key from our own presign endpoint (avatars/<admin id>/…), never an arbitrary path or URL.
            'avatar_url' => ['nullable', 'string', 'max:500', 'starts_with:avatars/'.$this->user()->id.'/'],
        ];
    }
}
