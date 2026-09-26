<?php

namespace App\Http\Requests\Api;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

class SmsVerifyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', 'max:20'],
            'country' => ['nullable', 'string', Rule::in(['TH', 'MM'])],
            'code' => ['required', 'string', 'regex:/^\d{6}$/'],
            'referral_code' => ['nullable', 'string', 'max:16'],
            'device_name' => ['nullable', 'string', 'max:60'],
        ];
    }
}
