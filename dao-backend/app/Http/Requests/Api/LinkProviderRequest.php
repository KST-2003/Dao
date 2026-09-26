<?php

namespace App\Http\Requests\Api;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

class LinkProviderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_token' => ['nullable', 'string', 'max:4096'],
            'code' => ['nullable', 'string', 'max:512'],
            'code_verifier' => ['nullable', 'string', 'max:128'],
            'redirect_uri' => ['nullable', 'string', 'max:512'],
            'phone' => ['nullable', 'string', 'max:20'],
            'country' => ['nullable', 'string', Rule::in(['TH', 'MM'])],
            'otp' => ['nullable', 'string', 'regex:/^\d{6}$/'],
        ];
    }
}
