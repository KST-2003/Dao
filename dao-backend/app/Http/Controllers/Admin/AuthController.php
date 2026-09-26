<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\LoginRequest;
use App\Models\AdminUser;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Cookie;

class AuthController extends AdminController
{
    public function login(LoginRequest $request, AuditLogger $audit): JsonResponse
    {
        $admin = AdminUser::query()->with('role')->where('email', strtolower((string) $request->input('email')))->first();

        // Same response for unknown email / wrong password / inactive account (no user enumeration).
        if (! $admin || ! $admin->is_active || ! Hash::check((string) $request->input('password'), $admin->password)) {
            $audit->log(null, 'admin.login_failed', null, ['email' => strtolower((string) $request->input('email'))]);

            return response()->json(['message' => __('errors.INVALID_CREDENTIALS'), 'code' => 'INVALID_CREDENTIALS'], 401);
        }

        $ttl = (int) config('dao.admin.token_ttl_minutes');
        $token = $admin->createToken('admin-dashboard', ['admin'], now()->addMinutes($ttl))->plainTextToken;
        $admin->forceFill(['last_login_at' => now()])->save();
        $audit->log($admin, 'admin.login', $admin);

        return response()
            ->json(['data' => $this->present($admin)])
            ->withCookie($this->cookie($token, $ttl));
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->present($request->user()->load('role'))]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['data' => ['logged_out' => true]])->withCookie($this->cookie('', -1));
    }

    private function present(AdminUser $admin): array
    {
        return [
            'id' => $admin->id,
            'name' => $admin->name,
            'email' => $admin->email,
            'role' => ['slug' => $admin->role->slug, 'name' => $admin->role->name],
            'permissions' => $admin->role->permissions,
        ];
    }

    private function cookie(string $value, int $minutes): Cookie
    {
        return Cookie::create(
            name: config('dao.admin.cookie'),
            value: $value,
            expire: $minutes > 0 ? now()->addMinutes($minutes) : 1,
            path: '/api/admin',
            domain: config('dao.admin.cookie_domain'),
            secure: app()->isProduction(),
            httpOnly: true,
            raw: false,
            sameSite: Cookie::SAMESITE_STRICT,
        );
    }
}
