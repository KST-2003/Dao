<?php

namespace App\Http\Requests\Api;

use App\Enums\Gender;
use App\Enums\Locale;
use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'display_name' => ['sometimes', 'nullable', 'string', 'max:60'],
            'email' => ['sometimes', 'nullable', 'email:rfc', 'max:190', Rule::unique('users', 'email')->ignore($this->user()?->id)],
            'preferred_language' => ['sometimes', Rule::in(Locale::values())],
            'country' => ['sometimes', 'nullable', Rule::in(['TH', 'MM'])],
            'date_of_birth' => ['sometimes', 'nullable', 'date', 'before:today', 'after:1900-01-01'],
            'gender' => ['sometimes', 'nullable', Rule::enum(Gender::class)],
            'avatar' => ['sometimes', 'nullable', 'image', 'max:5120'],
        ];
    }
}
