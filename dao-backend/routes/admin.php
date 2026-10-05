<?php

use App\Http\Controllers\Admin;
use Illuminate\Support\Facades\Route;

/*
| Admin API — prefix /api/admin/v1, middleware api + admin.cookie (see bootstrap/app.php).
| Every route after login requires an admin token and a role permission (admin.can:*).
*/

Route::post('/auth/login', [Admin\AuthController::class, 'login'])->middleware('throttle:admin-login');

Route::middleware(['auth:sanctum', 'admin', 'throttle:api'])->group(function () {
    Route::get('/auth/me', [Admin\AuthController::class, 'me']);
    Route::post('/auth/logout', [Admin\AuthController::class, 'logout']);

    Route::get('/dashboard', Admin\DashboardController::class)->middleware('admin.can:dashboard.view');

    Route::middleware('admin.can:products.manage')->group(function () {
        Route::get('/products', [Admin\ProductController::class, 'index']);
        Route::post('/products', [Admin\ProductController::class, 'store']);
        Route::get('/products/{id}', [Admin\ProductController::class, 'show'])->whereNumber('id');
        Route::put('/products/{id}', [Admin\ProductController::class, 'update'])->whereNumber('id');
        Route::delete('/products/{id}', [Admin\ProductController::class, 'destroy'])->whereNumber('id');
        Route::post('/products/{id}/publish', [Admin\ProductController::class, 'publish'])->whereNumber('id');
        Route::post('/products/{id}/unpublish', [Admin\ProductController::class, 'unpublish'])->whereNumber('id');
        Route::post('/products/{id}/variants', [Admin\ProductController::class, 'storeVariant'])->whereNumber('id');
        Route::put('/products/{id}/variants/{variantId}', [Admin\ProductController::class, 'updateVariant'])->whereNumber(['id', 'variantId']);
        Route::delete('/products/{id}/variants/{variantId}', [Admin\ProductController::class, 'destroyVariant'])->whereNumber(['id', 'variantId']);
        Route::post('/products/{id}/images/presign', [Admin\ProductController::class, 'presignImage'])->whereNumber('id');
        Route::post('/products/{id}/images', [Admin\ProductController::class, 'storeImage'])->whereNumber('id');
        Route::put('/products/{id}/images/order', [Admin\ProductController::class, 'reorderImages'])->whereNumber('id');
        Route::delete('/products/{id}/images/{imageId}', [Admin\ProductController::class, 'destroyImage'])->whereNumber(['id', 'imageId']);

        foreach (['categories' => Admin\CategoryController::class, 'collections' => Admin\CollectionController::class] as $uri => $controller) {
            Route::get("/{$uri}", [$controller, 'index']);
            Route::post("/{$uri}", [$controller, 'store']);
            Route::get("/{$uri}/{id}", [$controller, 'show'])->whereNumber('id');
            Route::put("/{$uri}/{id}", [$controller, 'update'])->whereNumber('id');
            Route::delete("/{$uri}/{id}", [$controller, 'destroy'])->whereNumber('id');
        }
    });

    Route::middleware('admin.can:inventory.manage')->group(function () {
        Route::get('/inventory', [Admin\InventoryController::class, 'index']);
        Route::post('/inventory/adjust', [Admin\InventoryController::class, 'adjust']);
        Route::get('/inventory/{variantId}/movements', [Admin\InventoryController::class, 'movements'])->whereNumber('variantId');
    });

    Route::middleware('admin.can:orders.view,orders.manage')->group(function () {
        Route::get('/orders', [Admin\OrderController::class, 'index']);
        Route::get('/orders/{id}', [Admin\OrderController::class, 'show'])->whereNumber('id');
    });
    Route::middleware('admin.can:orders.manage')->group(function () {
        Route::post('/orders/{id}/status', [Admin\OrderController::class, 'transition'])->whereNumber('id');
        Route::post('/orders/{id}/mark-paid', [Admin\OrderController::class, 'markPaid'])->whereNumber('id');
        Route::post('/orders/{id}/refund', [Admin\OrderController::class, 'refund'])->whereNumber('id');
        Route::put('/orders/{id}/shipment', [Admin\OrderController::class, 'shipment'])->whereNumber('id');
    });

    Route::middleware('admin.can:customers.view')->group(function () {
        Route::get('/customers', [Admin\CustomerController::class, 'index']);
        Route::get('/customers/{id}', [Admin\CustomerController::class, 'show'])->whereNumber('id');
    });

    Route::middleware('admin.can:loyalty.manage')->group(function () {
        Route::get('/points/ledger', [Admin\LoyaltyController::class, 'ledger']);
        Route::post('/points/adjust', [Admin\LoyaltyController::class, 'adjust']);
        Route::post('/points/campaigns', [Admin\LoyaltyController::class, 'campaign']);
        foreach (['membership-tiers' => Admin\MembershipTierController::class, 'rewards' => Admin\RewardController::class] as $uri => $controller) {
            Route::get("/{$uri}", [$controller, 'index']);
            Route::post("/{$uri}", [$controller, 'store']);
            Route::get("/{$uri}/{id}", [$controller, 'show'])->whereNumber('id');
            Route::put("/{$uri}/{id}", [$controller, 'update'])->whereNumber('id');
            Route::delete("/{$uri}/{id}", [$controller, 'destroy'])->whereNumber('id');
        }
    });

    Route::middleware('admin.can:marketing.manage')->group(function () {
        foreach (['coupons' => Admin\CouponController::class, 'banners' => Admin\BannerController::class] as $uri => $controller) {
            Route::get("/{$uri}", [$controller, 'index']);
            Route::post("/{$uri}", [$controller, 'store']);
            Route::get("/{$uri}/{id}", [$controller, 'show'])->whereNumber('id');
            Route::put("/{$uri}/{id}", [$controller, 'update'])->whereNumber('id');
            Route::delete("/{$uri}/{id}", [$controller, 'destroy'])->whereNumber('id');
        }
    });

    Route::middleware('admin.can:content.manage')->group(function () {
        foreach (['videos' => Admin\VideoController::class, 'recipes' => Admin\RecipeController::class] as $uri => $controller) {
            Route::get("/{$uri}", [$controller, 'index']);
            Route::post("/{$uri}", [$controller, 'store']);
            Route::get("/{$uri}/{id}", [$controller, 'show'])->whereNumber('id');
            Route::put("/{$uri}/{id}", [$controller, 'update'])->whereNumber('id');
            Route::delete("/{$uri}/{id}", [$controller, 'destroy'])->whereNumber('id');
        }
    });

    Route::post('/uploads', Admin\UploadController::class)->middleware('admin.can:products.manage,content.manage,marketing.manage');

    Route::middleware('admin.can:reviews.moderate')->group(function () {
        Route::get('/reviews', [Admin\ReviewController::class, 'index']);
        Route::post('/reviews/{id}/moderate', [Admin\ReviewController::class, 'moderate'])->whereNumber('id');
    });

    Route::middleware('admin.can:notifications.send')->group(function () {
        Route::get('/notifications', [Admin\NotificationController::class, 'index']);
        Route::post('/notifications/broadcast', [Admin\NotificationController::class, 'broadcast']);
    });

    Route::middleware('admin.can:settings.manage')->group(function () {
        Route::get('/settings', [Admin\SettingController::class, 'index']);
        Route::put('/settings', [Admin\SettingController::class, 'update']);
    });

    Route::middleware('admin.can:admins.manage')->group(function () {
        Route::get('/admin-users', [Admin\AdminUserController::class, 'index']);
        Route::get('/admin-roles', [Admin\AdminUserController::class, 'roles']);
        Route::post('/admin-users', [Admin\AdminUserController::class, 'store']);
        Route::put('/admin-users/{id}', [Admin\AdminUserController::class, 'update'])->whereNumber('id');
    });

    Route::get('/audit-logs', [Admin\AuditLogController::class, 'index'])->middleware('admin.can:audit.view');
});
