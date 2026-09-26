<?php

namespace App\Http\Requests\Api;


use Illuminate\Foundation\Http\FormRequest;

class GoogleLoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_token' => ['required', 'string', 'max:4096'],
            'referral_code' => ['nullable', 'string', 'max:16'],
            'device_name' => ['nullable', 'string', 'max:60'],
        ];
    }
}
