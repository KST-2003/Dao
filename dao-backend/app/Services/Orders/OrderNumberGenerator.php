<?php

namespace App\Services\Orders;

use App\Models\Order;
use Illuminate\Support\Str;

class OrderNumberGenerator
{
    /** e.g. DAO-260926-7K3Q9 (unambiguous alphabet, no 0/O/1/I). */
    public function next(): string
    {
        $alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        do {
            $suffix = '';
            for ($i = 0; $i < 5; $i++) {
                $suffix .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }
            $number = 'DAO-'.now()->format('ymd').'-'.$suffix;
        } while (Order::query()->where('order_number', $number)->exists());

        return Str::upper($number);
    }
}
