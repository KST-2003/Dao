<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CommentImagePresignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['content_type' => ['required', Rule::in(['image/jpeg', 'image/png', 'image/webp'])]];
    }
}
