<?php

namespace App\Providers;

use App\Contracts\FileStorageInterface;
use App\Contracts\PushProviderInterface;
use App\Contracts\OtpProviderInterface;
use App\Models;
use App\Services\Auth\GoogleIdentityProvider;
use App\Services\Auth\LineIdentityProvider;
use App\Services\Notifications\ExpoPushProvider;
use App\Services\Payments\Gateways\BankTransferGateway;
use App\Services\Payments\Gateways\CashOnDeliveryGateway;
use App\Services\Payments\Gateways\StripeCheckoutGateway;
use App\Services\Payments\PaymentManager;
use App\Services\Settings\SettingsService;
use App\Services\Sms\FakeOtpProvider;
use App\Services\Sms\LogOtpProvider;
use App\Services\Sms\ThaiBulkSmsOtpProvider;
use App\Services\Sms\UnconfiguredOtpProvider;
use App\Services\Storage\FileStorageService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(SettingsService::class);

        // --- OTP: never pretend. "log" only in local; "fake" only in tests; otherwise a real provider or 503. ---
        $this->app->singleton(OtpProviderInterface::class, function ($app) {
            $driver = config('dao.sms.driver');
            $env = $app->environment();

            return match (true) {
                $driver === 'thaibulksms' => new ThaiBulkSmsOtpProvider(config('services.thaibulksms.key'), config('services.thaibulksms.secret'), config('services.thaibulksms.sender')),
                $driver === 'fake' && $env === 'testing' => new FakeOtpProvider,
                $driver === 'log' && $env === 'local' => new LogOtpProvider,
                default => new UnconfiguredOtpProvider,
            };
        });

        $this->app->singleton(GoogleIdentityProvider::class, fn () => new GoogleIdentityProvider(config('services.google.client_ids', [])));
        $this->app->singleton(LineIdentityProvider::class, fn () => new LineIdentityProvider(config('services.line.channel_id'), config('services.line.channel_secret')));

        $this->app->singleton(StripeCheckoutGateway::class, fn () => new StripeCheckoutGateway(
            config('services.stripe.secret'), config('services.stripe.webhook_secret'),
            (string) config('services.stripe.success_url'), (string) config('services.stripe.cancel_url'),
        ));
        $this->app->singleton(PaymentManager::class, fn ($app) => new PaymentManager([
            $app->make(CashOnDeliveryGateway::class),
            $app->make(BankTransferGateway::class),
            $app->make(StripeCheckoutGateway::class),
        ]));

        $this->app->singleton(PushProviderInterface::class, fn () => new ExpoPushProvider(config('services.expo.access_token')));

        $this->app->bind(FileStorageInterface::class, fn () => new FileStorageService(
            Storage::disk(config('filesystems.default')),
            (string) config('filesystems.r2_public_url', ''),
        ));
    }

    public function boot(): void
    {
        // Stable morph names in the DB (never class names).
        Relation::enforceMorphMap([
            'user' => Models\User::class,
            'admin_user' => Models\AdminUser::class,
            'order' => Models\Order::class,
            'product' => Models\Product::class,
            'product_variant' => Models\ProductVariant::class,
            'video' => Models\Video::class,
            'recipe' => Models\Recipe::class,
            'review' => Models\Review::class,
            'reward' => Models\Reward::class,
            'referral' => Models\Referral::class,
            'coupon' => Models\Coupon::class,
            'collection' => Models\Collection::class,
            'category' => Models\Category::class,
            'membership_tier' => Models\MembershipTier::class,
            'banner' => Models\Banner::class,
            'setting' => Models\Setting::class,
        ]);

        RateLimiter::for('api', fn (Request $r) => Limit::perMinute(120)->by($r->user()?->getAuthIdentifier() ?: $r->ip()));
        RateLimiter::for('auth', fn (Request $r) => Limit::perMinute(20)->by($r->ip()));
        RateLimiter::for('otp', fn (Request $r) => [
            Limit::perMinute(5)->by('otp-ip:'.$r->ip()),
            Limit::perHour(30)->by('otp-ip-h:'.$r->ip()),
        ]);
        RateLimiter::for('admin-login', fn (Request $r) => Limit::perMinute(5)->by(strtolower((string) $r->input('email')).'|'.$r->ip()));
        RateLimiter::for('writes', fn (Request $r) => Limit::perMinute(30)->by($r->user()?->getAuthIdentifier() ?: $r->ip()));
    }
}
