<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/** Updates users.last_active_at at most every 10 minutes (no write per request). */
class TouchLastActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if ($user instanceof User && Cache::add("last_active:{$user->id}", 1, now()->addMinutes(10))) {
            User::query()->whereKey($user->id)->update(['last_active_at' => now()]);
        }

        return $next($request);
    }
}
