<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\Locale;
use App\Http\Controllers\Controller;
use App\Services\Auth\GoogleIdentityProvider;
use App\Services\Auth\LineIdentityProvider;
use App\Services\Payments\PaymentManager;
use App\Services\Settings\SettingsService;
use Illuminate\Http\JsonResponse;

/** Public app bootstrap config: which login/payment options are actually configured. */
class ConfigController extends Controller
{
    public function __invoke(GoogleIdentityProvider $google, LineIdentityProvider $line, PaymentManager $payments, SettingsService $settings): JsonResponse
    {
        return $this->ok([
            'locales' => Locale::values(),
            'fallback_locale' => config('dao.fallback_locale'),
            'currency' => config('dao.default_currency'),
            'auth' => [
                'google' => $google->isConfigured(),
                'line' => $line->isConfigured(),
                'sms' => in_array(config('dao.sms.driver'), ['twilio', 'log', 'fake'], true),
            ],
            'payment_methods' => array_map(fn ($g) => $g->method()->value, $payments->available()),
            'loyalty' => [
                'redeem_points_unit' => $settings->int('loyalty.redeem_points_unit'),
                'redeem_value_per_unit' => $settings->int('loyalty.redeem_value_per_unit'),
                'redeem_min_points' => $settings->int('loyalty.redeem_min_points'),
                'redeem_max_percent' => $settings->int('loyalty.redeem_max_percent'),
            ],
            'shipping' => [
                'standard_fee' => $settings->int('shipping.standard_fee'),
                'express_fee' => $settings->int('shipping.express_fee'),
                'free_threshold' => $settings->int('shipping.free_threshold'),
            ],
        ]);
    }
}
