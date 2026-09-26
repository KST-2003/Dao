<?php

namespace App\Enums;

enum CouponScope: string
{
    case All = 'all';
    case Products = 'products';
    case Categories = 'categories';
}
