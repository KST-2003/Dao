<?php

namespace App\Http\Controllers\Admin;

use App\Exceptions\DomainException;
use App\Http\Requests\Admin\AdminUserRequest;
use App\Models\AdminRole;
use App\Models\AdminUser;
use Illuminate\Http\JsonResponse;

class AdminUserController extends AdminController
{
    public function index(): JsonResponse
    {
        return $this->paginated(AdminUser::query()->with('role')->orderBy('name')->paginate($this->perPage()), fn (AdminUser $a) => $this->present($a));
    }

    public function roles(): JsonResponse
    {
        return response()->json(['data' => AdminRole::query()->orderBy('id')->get()]);
    }

    public function store(AdminUserRequest $request): JsonResponse
    {
        $admin = AdminUser::query()->create($request->validated());
        $this->audit('admin_user.created', $admin, ['email' => $admin->email, 'role' => $admin->admin_role_id]);

        return response()->json(['data' => $this->present($admin->load('role'))], 201);
    }

    public function update(AdminUserRequest $request, int $id): JsonResponse
    {
        $admin = AdminUser::query()->findOrFail($id);
        if ($admin->id === $this->admin()->id && ($request->has('is_active') && ! $request->boolean('is_active'))) {
            throw DomainException::of('CANNOT_DEACTIVATE_SELF', 422);
        }
        $data = array_filter($request->validated(), fn ($v, $k) => $k !== 'password' || ! empty($v), ARRAY_FILTER_USE_BOTH);
        $admin->fill($data)->save();
        if (! $admin->is_active || isset($data['password'])) {
            $admin->tokens()->delete(); // force re-login
        }
        $this->audit('admin_user.updated', $admin, $this->auditChanges($data));

        return response()->json(['data' => $this->present($admin->load('role'))]);
    }

    private function auditChanges(array $data): array
    {
        if (isset($data['password'])) {
            $data['password'] = '[changed]';
        }

        return $data;
    }

    private function present(AdminUser $a): array
    {
        return [
            'id' => $a->id, 'name' => $a->name, 'email' => $a->email, 'is_active' => $a->is_active,
            'role' => $a->role?->only(['id', 'slug', 'name']),
            'last_login_at' => $a->last_login_at?->toIso8601String(),
        ];
    }
}
