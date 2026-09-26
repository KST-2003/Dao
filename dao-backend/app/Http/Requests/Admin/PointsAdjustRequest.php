<?php

namespace App\Http\Requests\Admin;


class PointsAdjustRequest extends AdminRequest
{
    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'points' => ['required', 'integer', 'not_in:0', 'between:-1000000,1000000'],
            'reason' => ['required', 'string', 'min:5', 'max:500'],
        ];
    }
}
