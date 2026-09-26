<?php

namespace App\Http\Requests\Admin;

use App\Enums\Locale;
use Illuminate\Foundation\Http\FormRequest;

/** Base for admin requests. Route middleware already enforces permissions. */
abstract class AdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * The dashboard sends every form field; drop nulls for fields whose rules are not nullable,
     * so "cleared" optional inputs keep the column default instead of failing validation.
     */
    protected function prepareForValidation(): void
    {
        $rules = $this->rules();
        $clean = [];
        foreach ($this->all() as $key => $value) {
            $rule = $rules[$key] ?? null;
            $isNullable = is_array($rule) ? in_array('nullable', $rule, true) : (is_string($rule) && str_contains($rule, 'nullable'));
            if ($value === null && $rule !== null && ! $isNullable) {
                continue;
            }
            $clean[$key] = $value;
        }
        $this->replace($clean);
    }

    /**
     * translations.{en|th|my}.{field}. The fallback locale's required fields must be filled,
     * so the app never shows an empty title or a raw key.
     *
     * @param  array<string, string>  $fields  field => base rule (e.g. 'string|max:190')
     * @param  list<string>  $required
     */
    protected function translationRules(array $fields, array $required = []): array
    {
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');
        $rules = ['translations' => [$isUpdate ? 'sometimes' : 'required', 'array']];
        $fallback = config('dao.fallback_locale');
        foreach (Locale::values() as $locale) {
            foreach ($fields as $field => $rule) {
                $needed = $locale === $fallback && in_array($field, $required, true);
                $rules["translations.{$locale}.{$field}"] = array_merge(
                    [$needed ? ($isUpdate ? 'required_with:translations' : 'required') : 'nullable'],
                    explode('|', $rule),
                );
            }
        }

        return $rules;
    }
}
