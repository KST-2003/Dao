<?php

use App\Http\Controllers\Api\V1;
use Illuminate\Support\Facades\Route;

// Health check — intentionally public, no throttle
Route::get('/health', static fn () => response()->json([
    'status' => 'ok',
    'time' => now()->toIso8601String(),
]));

// Payment provider webhooks (signature-verified, no auth)
Route::post('/webhooks/stripe', V1\StripeWebhookController::class)->name('webhooks.stripe');

Route::prefix('v1')->middleware('throttle:api')->name('v1.')->group(function () {
    // ---------- Public ----------
    Route::get('/config', V1\ConfigController::class);

    Route::middleware('throttle:auth')->prefix('auth')->group(function () {
        Route::post('/sms/request', [V1\AuthController::class, 'smsRequest'])->middleware('throttle:otp');
        Route::post('/sms/verify', [V1\AuthController::class, 'smsVerify']);
        Route::post('/google', [V1\AuthController::class, 'google']);
        Route::post('/line', [V1\AuthController::class, 'line']);
    });

    // Public browsing (a bearer token, if sent, personalizes prices/saved state)
    Route::get('/home', V1\HomeController::class);
    Route::get('/search', V1\SearchController::class);
    Route::get('/categories', [V1\CatalogController::class, 'categories']);
    Route::get('/shop', [V1\CatalogController::class, 'shopLanding']);
    Route::get('/collections', [V1\CatalogController::class, 'collections']);
    Route::get('/collections/{slug}', [V1\CatalogController::class, 'collection']);
    Route::get('/products', [V1\ProductController::class, 'index']);
    Route::get('/products/{id}', [V1\ProductController::class, 'show'])->whereNumber('id');
    Route::get('/products/{id}/related', [V1\ProductController::class, 'related'])->whereNumber('id');
    Route::get('/products/{id}/reviews', [V1\ProductController::class, 'reviews'])->whereNumber('id');
    Route::get('/videos', [V1\VideoController::class, 'index']);
    Route::get('/videos/{id}', [V1\VideoController::class, 'show'])->whereNumber('id');
    Route::get('/videos/{id}/related', [V1\VideoController::class, 'related'])->whereNumber('id');
    Route::get('/videos/{id}/comments', [V1\VideoController::class, 'comments'])->whereNumber('id');
    Route::post('/videos/{id}/view', [V1\VideoController::class, 'view'])->whereNumber('id')->middleware('throttle:writes');
    Route::get('/kitchen', [V1\RecipeController::class, 'kitchen']);
    Route::get('/recipes', [V1\RecipeController::class, 'index']);
    Route::get('/recipes/{id}', [V1\RecipeController::class, 'show'])->whereNumber('id');

    // ---------- Customer (Sanctum bearer token with the `customer` ability) ----------
    Route::middleware(['auth:sanctum', 'customer', 'active'])->group(function () {
        Route::post('/auth/logout', [V1\AuthController::class, 'logout']);

        Route::get('/me', [V1\MeController::class, 'show']);
        Route::patch('/me', [V1\MeController::class, 'update']);
        Route::post('/me', [V1\MeController::class, 'update']);
        Route::post('/me/avatar/presign', [V1\MeController::class, 'presignAvatar']);
        Route::delete('/me', [V1\MeController::class, 'destroy']);
        Route::post('/me/providers/{provider}', [V1\MeController::class, 'linkProvider'])->middleware('throttle:auth');
        Route::delete('/me/providers/{provider}', [V1\MeController::class, 'unlinkProvider']);
        Route::post('/me/devices', [V1\MeController::class, 'registerDevice']);
        Route::delete('/me/devices', [V1\MeController::class, 'unregisterDevice']);

        Route::get('/me/addresses', [V1\AddressController::class, 'index']);
        Route::post('/me/addresses', [V1\AddressController::class, 'store']);
        Route::put('/me/addresses/{id}', [V1\AddressController::class, 'update'])->whereNumber('id');
        Route::delete('/me/addresses/{id}', [V1\AddressController::class, 'destroy'])->whereNumber('id');

        Route::get('/me/points', [V1\LoyaltyController::class, 'points']);
        Route::get('/me/membership', [V1\LoyaltyController::class, 'membership']);
        Route::get('/me/coupons', [V1\LoyaltyController::class, 'coupons']);
        Route::get('/me/referral', [V1\LoyaltyController::class, 'referral']);
        Route::get('/rewards', [V1\LoyaltyController::class, 'rewards']);
        Route::post('/rewards/{id}/redeem', [V1\LoyaltyController::class, 'redeemReward'])->whereNumber('id')->middleware('throttle:writes');

        Route::get('/me/recently-viewed', [V1\ProductController::class, 'recentlyViewed']);
        Route::post('/products/{id}/reviews', [V1\ProductController::class, 'storeReview'])->whereNumber('id')->middleware('throttle:writes');
        Route::post('/reviews/photos/presign', [V1\ProductController::class, 'presignReviewPhoto'])->middleware('throttle:writes');
        Route::post('/reviews/{reviewId}/report', [V1\ProductController::class, 'reportReview'])->whereNumber('reviewId')->middleware('throttle:writes');

        Route::get('/me/saved/{type}', [V1\SavedItemController::class, 'index']);
        Route::post('/me/saved', [V1\SavedItemController::class, 'store']);
        Route::delete('/me/saved/{type}/{id}', [V1\SavedItemController::class, 'destroy'])->whereNumber('id');

        Route::get('/cart', [V1\CartController::class, 'show']);
        Route::post('/cart/items', [V1\CartController::class, 'add']);
        Route::patch('/cart/items/{itemId}', [V1\CartController::class, 'update'])->whereNumber('itemId');
        Route::delete('/cart/items/{itemId}', [V1\CartController::class, 'remove'])->whereNumber('itemId');
        Route::post('/cart/items/{itemId}/save-for-later', [V1\CartController::class, 'saveForLater'])->whereNumber('itemId');
        Route::post('/cart/items/{itemId}/accept-price', [V1\CartController::class, 'acceptPrice'])->whereNumber('itemId');
        Route::put('/cart/options', [V1\CartController::class, 'applyOptions']);

        Route::get('/checkout/options', [V1\CheckoutController::class, 'options']);
        Route::post('/checkout/quote', [V1\CheckoutController::class, 'quote']);
        Route::post('/orders', [V1\CheckoutController::class, 'placeOrder'])->middleware('throttle:writes');
        Route::get('/orders', [V1\OrderController::class, 'index']);
        Route::get('/orders/{id}', [V1\OrderController::class, 'show'])->whereNumber('id');
        Route::post('/orders/{id}/cancel', [V1\OrderController::class, 'cancel'])->whereNumber('id');
        Route::post('/orders/{id}/pay', [V1\OrderController::class, 'pay'])->whereNumber('id');

        Route::post('/videos/{id}/like', [V1\VideoController::class, 'like'])->whereNumber('id');
        Route::delete('/videos/{id}/like', [V1\VideoController::class, 'unlike'])->whereNumber('id');
        Route::post('/videos/{id}/comments', [V1\VideoController::class, 'comment'])->whereNumber('id')->middleware('throttle:writes');
        Route::post('/videos/{id}/download', [V1\VideoController::class, 'download'])->whereNumber('id')->middleware('throttle:writes');

        Route::get('/notifications', [V1\NotificationController::class, 'index']);
        Route::post('/notifications/{id}/read', [V1\NotificationController::class, 'markRead'])->whereNumber('id');
        Route::post('/notifications/read-all', [V1\NotificationController::class, 'markAllRead']);
    });
});
