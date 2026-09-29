<?php

use App\Exceptions\DomainException;
use App\Http\Middleware\AdminTokenFromCookie;
use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsureAdminPermission;
use App\Http\Middleware\EnsureCustomer;
use App\Http\Middleware\SetLocale;
use App\Http\Middleware\TouchLastActive;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function (): void {
            Route::middleware(['api', 'admin.cookie'])
                ->prefix('api/admin/v1')
                ->name('admin.')
                ->group(base_path('routes/admin.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');
        $middleware->api(append: [SetLocale::class]);
        // Laravel's $middlewarePriority pulls Authenticate (via the AuthenticatesRequests
        // interface it implements) ahead of the 'api' group's SubstituteBindings, and since
        // AdminTokenFromCookie isn't in that priority list, it got left behind — auth:sanctum
        // ran before the cookie was ever copied into the Authorization header. Priority-listing
        // it right alongside Authenticate fixes that.
        $middleware->prependToPriorityList(
            before: \Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests::class,
            prepend: AdminTokenFromCookie::class,
        );
        $middleware->alias([
            'admin.cookie' => AdminTokenFromCookie::class,
            'admin' => EnsureAdmin::class,
            'admin.can' => EnsureAdminPermission::class,
            'customer' => EnsureCustomer::class,
            'active' => TouchLastActive::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Every API error has the same shape: { message, code, errors? }.
        // Stack traces are never leaked (even with APP_DEBUG the shape is kept).
        $json = static function (string $message, string $code, int $status, array $errors = []): JsonResponse {
            $body = ['message' => $message, 'code' => $code];
            if ($errors !== []) {
                $body['errors'] = $errors;
            }

            return response()->json($body, $status);
        };

        $exceptions->shouldRenderJsonWhen(
            static fn (Request $request): bool => $request->is('api/*') || $request->expectsJson()
        );

        $exceptions->render(function (Throwable $e, Request $request) use ($json) {
            if (! $request->is('api/*')) {
                return null;
            }

            return match (true) {
                $e instanceof DomainException => $json($e->getMessage(), $e->errorCode, $e->status, $e->errors),
                $e instanceof ValidationException => $json(__('errors.VALIDATION_FAILED'), 'VALIDATION_FAILED', 422, $e->errors()),
                $e instanceof AuthenticationException => $json(__('errors.UNAUTHENTICATED'), 'UNAUTHENTICATED', 401),
                $e instanceof AuthorizationException,
                $e instanceof AccessDeniedHttpException => $json(__('errors.FORBIDDEN'), 'FORBIDDEN', 403),
                $e instanceof ModelNotFoundException,
                $e instanceof NotFoundHttpException => $json(__('errors.NOT_FOUND'), 'NOT_FOUND', 404),
                $e instanceof ThrottleRequestsException => $json(__('errors.TOO_MANY_REQUESTS'), 'TOO_MANY_REQUESTS', 429),
                $e instanceof HttpExceptionInterface => $json(__('errors.HTTP_ERROR'), 'HTTP_ERROR', $e->getStatusCode()),
                default => $json(__('errors.SERVER_ERROR'), 'SERVER_ERROR', 500),
            };
        });
    })
    ->create();
