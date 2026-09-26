<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class AdminUserRequest extends AdminRequest
{
    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'name' => [$id ? 'sometimes' : 'required', 'string', 'max:120'],
            'email' => [$id ? 'sometimes' : 'required', 'email', 'max:190', Rule::unique('admin_users', 'email')->ignore($id)],
            'password' => [$id ? 'nullable' : 'required', Password::min(12)->letters()->numbers()],
            'admin_role_id' => [$id ? 'sometimes' : 'required', 'integer', 'exists:admin_roles,id'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
