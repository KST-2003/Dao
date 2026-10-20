<?php

namespace App\Http\Requests\Admin;

class ModerateCommentRequest extends AdminRequest
{
    public function rules(): array
    {
        return ['reason' => ['nullable', 'string', 'max:255']];
    }
}
