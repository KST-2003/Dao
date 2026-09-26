<?php

namespace App\Http\Requests\Api;


use Illuminate\Foundation\Http\FormRequest;

class LineLoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_token' => ['required_without:code', 'nullable', 'string', 'max:4096'],
            'code' => ['required_without:id_token', 'nullable', 'string', 'max:512'],
            'code_verifier' => ['required_with:code', 'nullable', 'string', 'max:128'],
            'redirect_uri' => ['required_with:code', 'nullable', 'string', 'max:512'],
            'referral_code' => ['nullable', 'string', 'max:16'],
            'device_name' => ['nullable', 'string', 'max:60'],
        ];
    }
}
