<?php

namespace App\Http\Requests\Api;

use App\Enums\DeliveryMethod;
use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

class QuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'coupon_code' => ['nullable', 'string', 'max:50'],
            'points' => ['nullable', 'integer', 'min:0'],
            'delivery_method' => ['nullable', Rule::enum(DeliveryMethod::class)],
        ];
    }
}
