<?php

namespace App\Http\Middleware;

use App\Models\AdminUser;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $admin = $request->user();
        if (! $admin instanceof AdminUser || ! $admin->is_active || ! $admin->tokenCan('admin')) {
            abort(403);
        }

        return $next($request);
    }
}
