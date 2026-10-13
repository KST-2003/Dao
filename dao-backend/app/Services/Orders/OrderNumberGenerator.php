<?php

namespace App\Services\Orders;

use App\Models\Order;
use App\Models\Preorder;
use Illuminate\Support\Str;

class OrderNumberGenerator
{
    /** e.g. DAO-260926-7K3Q9 (unambiguous alphabet, no 0/O/1/I). */
    public function next(): string
    {
        return $this->generate('DAO', fn (string $n) => Order::query()->where('order_number', $n)->exists());
    }

    /** e.g. PRE-260926-7K3Q9 */
    public function nextPreorder(): string
    {
        return $this->generate('PRE', fn (string $n) => Preorder::query()->where('preorder_number', $n)->exists());
    }

    private function generate(string $prefix, callable $exists): string
    {
        $alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        do {
            $suffix = '';
            for ($i = 0; $i < 5; $i++) {
                $suffix .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }
            $number = $prefix.'-'.now()->format('ymd').'-'.$suffix;
        } while ($exists($number));

        return Str::upper($number);
    }
}
