<?php

namespace App\Http\Requests\Admin;


class RefundRequest extends AdminRequest
{
    public function rules(): array
    {
        return [
            'restock' => ['required', 'boolean'],
            'note' => ['required', 'string', 'max:500'],
        ];
    }
}
