<?php

namespace App\Enums;

/** Thailand: standard / express. Myanmar: air cargo / land cargo. The method implies the destination country. */
enum DeliveryMethod: string
{
    case Standard = 'standard';
    case Express = 'express';
    case AirCargo = 'air_cargo';
    case LandCargo = 'land_cargo';

    public function country(): string
    {
        return match ($this) {
            self::Standard, self::Express => 'TH',
            self::AirCargo, self::LandCargo => 'MM',
        };
    }

    /** @return list<self> */
    public static function forCountry(?string $countryCode): array
    {
        $country = strtoupper((string) $countryCode);

        return array_values(array_filter(self::cases(), fn (self $m) => $m->country() === $country));
    }

    public static function defaultFor(?string $countryCode): self
    {
        return self::forCountry($countryCode)[0] ?? self::Standard;
    }

    /** Fee in THB minor units. */
    public function feeSettingKey(): string
    {
        return 'shipping.'.$this->value.'_fee';
    }

    /** Fee in MMK minor units; null = convert the THB fee at the exchange rate. */
    public function mmkFeeSettingKey(): string
    {
        return 'shipping.'.$this->value.'_fee_mmk';
    }
}
