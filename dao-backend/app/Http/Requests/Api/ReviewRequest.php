<?php

namespace App\Http\Requests\Api;


use Illuminate\Foundation\Http\FormRequest;

class ReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'body' => ['nullable', 'string', 'max:2000'],
            'photos' => ['nullable', 'array', 'max:5'],
            'photos.*' => ['string', 'max:500', function ($attribute, $value, $fail) {
                if (! str_starts_with($value, "reviews/{$this->user()?->id}/")) {
                    $fail('Invalid photo key.');
                }
            }],
        ];
    }
}
