<?php

namespace App\DTOs;

use App\Models\CartItem;
use App\Models\ProductVariant;

final readonly class PricedLine
{
    public function __construct(
        public ProductVariant $variant,
        public int $quantity,
        public int $listUnitPrice,
        public int $memberUnitPrice,
        public ?CartItem $cartItem = null,
    ) {}

    public function listTotal(): int
    {
        return $this->listUnitPrice * $this->quantity;
    }

    public function memberDiscount(): int
    {
        return ($this->listUnitPrice - $this->memberUnitPrice) * $this->quantity;
    }

    public function netTotal(): int
    {
        return $this->memberUnitPrice * $this->quantity;
    }
}
