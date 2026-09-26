<?php

namespace App\Http\Requests\Api;


use Illuminate\Foundation\Http\FormRequest;

class CommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'min:1', 'max:1000'],
            'parent_id' => ['nullable', 'integer'],
        ];
    }
}
