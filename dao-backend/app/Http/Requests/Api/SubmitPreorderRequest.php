<?php

namespace App\Http\Requests\Api;

class SubmitPreorderRequest extends PreorderQuoteRequest
{
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'address_id' => ['required', 'integer'],
            'expected_total' => ['required', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:500'],
            'idempotency_key' => ['required', 'string', 'max:64'],
        ]);
    }
}
