<?php

namespace App\Http\Requests\Admin;

class PreorderRefundRequest extends AdminRequest
{
    public function rules(): array
    {
        return ['note' => ['required', 'string', 'max:500']];
    }
}
