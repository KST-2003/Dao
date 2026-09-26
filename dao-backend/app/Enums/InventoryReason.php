<?php

namespace App\Enums;

enum InventoryReason: string
{
    case OrderPlaced = 'order_placed';
    case OrderCancelled = 'order_cancelled';
    case OrderRefunded = 'order_refunded';
    case Restock = 'restock';
    case Adjustment = 'adjustment';
    case Damaged = 'damaged';
}
