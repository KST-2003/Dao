<?php

namespace App\Http\Middleware;

use App\Enums\Currency;
use App\Services\Currency\CurrencyService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** The app sends `X-Currency: THB|MMK`; everything priced in this request uses it (THB when absent or unknown). */
class ResolveCurrency
{
    public function __construct(private readonly CurrencyService $currency) {}

    public function handle(Request $request, Closure $next): Response
    {
        $this->currency->use(Currency::fromHeader($request->header('X-Currency')));

        return $next($request);
    }
}
