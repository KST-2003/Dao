<?php

namespace App\Http\Middleware;

use App\Models\AdminUser;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Usage: ->middleware('admin.can:products.manage') */
class EnsureAdminPermission
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $admin = $request->user();
        if (! $admin instanceof AdminUser) {
            abort(403);
        }
        $admin->loadMissing('role');
        foreach ($permissions as $permission) {
            if ($admin->hasPermission($permission)) {
                return $next($request);
            }
        }
        abort(403);
    }
}
