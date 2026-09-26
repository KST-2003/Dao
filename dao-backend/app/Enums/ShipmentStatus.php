<?php

namespace App\Enums;

enum ShipmentStatus: string
{
    case Pending = 'pending';
    case InTransit = 'in_transit';
    case Delivered = 'delivered';
    case Returned = 'returned';
}
