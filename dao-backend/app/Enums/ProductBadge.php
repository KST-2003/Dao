<?php

namespace App\Enums;

enum ProductBadge: string
{
    case New = 'new';
    case Bestseller = 'bestseller';
    case DaoPick = 'dao_pick';
    case Limited = 'limited';
    case Vip = 'vip';
    case Sale = 'sale';
}
