<?php

namespace App\Http\Requests\Admin;

class CustomerContentAccessRequest extends AdminRequest
{
    public function rules(): array
    {
        return [
            'screenshot_override' => ['sometimes', 'boolean'],
            'download_override' => ['sometimes', 'boolean'],
        ];
    }
}
