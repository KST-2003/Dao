<?php

namespace App\Http\Middleware;

use App\Enums\Locale;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** X-Locale (sent by the app) → Accept-Language → default. Drives translated content + error messages. */
class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = Locale::fromHeader($request->header('X-Locale'))
            ?? Locale::fromHeader($request->header('Accept-Language'))
            ?? Locale::tryFrom((string) config('app.locale'))
            ?? Locale::En;

        app()->setLocale($locale->value);
        $response = $next($request);
        $response->headers->set('Content-Language', $locale->value);

        return $response;
    }
}
