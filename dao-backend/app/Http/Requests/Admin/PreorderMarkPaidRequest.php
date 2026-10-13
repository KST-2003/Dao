<?php

namespace App\Http\Requests\Admin;

class PreorderMarkPaidRequest extends AdminRequest
{
    public function rules(): array
    {
        return ['reference' => ['nullable', 'string', 'max:190'], 'note' => ['required', 'string', 'max:500']];
    }
}
