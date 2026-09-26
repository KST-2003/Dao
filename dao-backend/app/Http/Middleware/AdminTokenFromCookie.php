<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * The admin dashboard keeps its Sanctum token in an httpOnly, Secure, SameSite=Strict cookie
 * (unreadable by JavaScript). This copies it into the Authorization header.
 *
 * CSRF: state-changing requests authenticated by the cookie must carry X-Requested-With,
 * which a cross-site form cannot set and a cross-origin fetch cannot send without passing CORS.
 */
class AdminTokenFromCookie
{
    public function handle(Request $request, Closure $next): Response
    {
        $cookie = $request->cookies->get(config('dao.admin.cookie'));

        if ($cookie && ! $request->bearerToken()) {
            if (! $request->isMethodSafe() && $request->header('X-Requested-With') !== 'XMLHttpRequest') {
                abort(403);
            }
            $request->headers->set('Authorization', 'Bearer '.$cookie);
        }

        return $next($request);
    }
}
