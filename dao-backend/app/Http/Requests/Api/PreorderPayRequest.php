<?php

namespace App\Http\Requests\Api;

use App\Enums\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PreorderPayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['payment_method' => ['required', Rule::enum(PaymentMethod::class)->except(PaymentMethod::Cod)]];
    }
}
