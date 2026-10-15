<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\Currency;
use App\Enums\DeliveryMethod;
use App\Enums\Locale;
use App\Http\Controllers\Controller;
use App\Services\Auth\GoogleIdentityProvider;
use App\Services\Auth\LineIdentityProvider;
use App\Services\Currency\CurrencyService;
use App\Services\Payments\PaymentManager;
use App\Services\Pricing\PricingService;
use App\Services\Settings\SettingsService;
use Illuminate\Http\JsonResponse;

/** Public app bootstrap config: which login/payment options are actually configured. */
class ConfigController extends Controller
{
    public function __invoke(GoogleIdentityProvider $google, LineIdentityProvider $line, PaymentManager $payments, SettingsService $settings, CurrencyService $currencies, PricingService $pricing): JsonResponse
    {
        $current = $currencies->current();

        return $this->ok([
            'locales' => Locale::values(),
            'fallback_locale' => config('dao.fallback_locale'),
            'currency' => config('dao.default_currency'),
            // Customers choose THB or MMK; every price the API returns is in the one sent as X-Currency.
            'currencies' => ['options' => Currency::values(), 'default' => config('dao.default_currency'), 'mmk_per_thb' => $currencies->rateFor(Currency::MMK)],
            'auth' => [
                'google' => $google->isConfigured(),
                'line' => $line->isConfigured(),
                'sms' => in_array(config('dao.sms.driver'), ['thaibulksms', 'log', 'fake'], true),
            ],
            'payment_methods' => array_map(fn ($g) => $g->method()->value, $payments->available($current->value)),
            'loyalty' => [
                'redeem_points_unit' => $settings->int('loyalty.redeem_points_unit'),
                'redeem_value_per_unit' => $settings->int('loyalty.redeem_value_per_unit'),
                'redeem_min_points' => $settings->int('loyalty.redeem_min_points'),
                'redeem_max_percent' => $settings->int('loyalty.redeem_max_percent'),
            ],
            'shipping' => [
                'standard_fee' => $pricing->shippingFee(DeliveryMethod::Standard, $current),
                'express_fee' => $pricing->shippingFee(DeliveryMethod::Express, $current),
                'free_threshold' => $currencies->fromBase($settings->int('shipping.free_threshold'), $current),
            ],
        ]);
    }
}
