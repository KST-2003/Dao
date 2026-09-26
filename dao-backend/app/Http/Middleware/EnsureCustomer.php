<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Customer endpoints accept only customer tokens (an admin token cannot act as a shopper). */
class EnsureCustomer
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user instanceof User || ! $user->tokenCan('customer')) {
            abort(403);
        }

        return $next($request);
    }
}
