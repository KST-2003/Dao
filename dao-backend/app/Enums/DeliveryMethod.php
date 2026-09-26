<?php

namespace App\Enums;

enum DeliveryMethod: string
{
    case Standard = 'standard';
    case Express = 'express';

    public function feeSettingKey(): string
    {
        return 'shipping.'.$this->value.'_fee';
    }
}
