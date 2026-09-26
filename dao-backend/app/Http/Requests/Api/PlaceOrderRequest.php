<?php

namespace App\Http\Requests\Api;

use App\Enums\DeliveryMethod;
use App\Enums\PaymentMethod;
use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

class PlaceOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'address_id' => ['required', 'integer'],
            'delivery_method' => ['required', Rule::enum(DeliveryMethod::class)],
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)],
            'coupon_code' => ['nullable', 'string', 'max:50'],
            'points_to_redeem' => ['nullable', 'integer', 'min:0'],
            'expected_total' => ['required', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:500'],
            'idempotency_key' => ['required', 'string', 'max:64'],
        ];
    }
}
