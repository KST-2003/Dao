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
            'body' => ['nullable', 'string', 'max:1000', 'required_without:image'],
            'parent_id' => ['nullable', 'integer'],
            // Key returned by the presign endpoint; only the author's own folder is accepted.
            'image' => ['nullable', 'string', 'max:500', function ($attribute, $value, $fail) {
                if (! str_starts_with($value, "comments/{$this->user()?->id}/")) {
                    $fail('Invalid image key.');
                }
            }],
        ];
    }
}
