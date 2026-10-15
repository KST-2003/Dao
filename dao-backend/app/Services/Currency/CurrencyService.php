<?php

namespace App\Services\Currency;

use App\Enums\Currency;
use App\Services\Settings\SettingsService;

/**
 * THB is the base currency; MMK is derived from an admin-set rate (`currency.mmk_per_thb`) unless a product /
 * delivery fee has its own MMK price. The currency of the current request comes from the app's X-Currency header
 * (see ResolveCurrency), so every price in a response is in the currency the customer chose.
 */
class CurrencyService
{
    private Currency $current = Currency::THB;

    public function __construct(private readonly SettingsService $settings) {}

    public function current(): Currency
    {
        return $this->current;
    }

    public function use(Currency $currency): void
    {
        $this->current = $currency;
    }

    /** Units of $currency per 1 THB (1.0 for THB itself). */
    public function rateFor(Currency|string $currency): float
    {
        $currency = $currency instanceof Currency ? $currency : (Currency::tryFrom($currency) ?? Currency::THB);

        return $currency === Currency::THB ? 1.0 : max(0.0001, (float) $this->settings->get('currency.mmk_per_thb', 100));
    }

    /** THB minor units → minor units of $to (default: the request's currency). Both currencies use 100 minor per unit. */
    public function fromBase(int $thbMinor, Currency|string|null $to = null): int
    {
        return (int) round($thbMinor * $this->rateFor($to ?? $this->current));
    }

    /** Minor units of $from → THB minor units. Pass the order's own snapshotted $rate to stay exact after rate changes. */
    public function toBase(int $minor, Currency|string|null $from = null, ?float $rate = null): int
    {
        return (int) round($minor / ($rate ?? $this->rateFor($from ?? $this->current)));
    }
}
