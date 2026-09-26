<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ProductVariant> */
class ProductVariantFactory extends Factory
{
    protected $model = ProductVariant::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'sku' => 'SKU-'.fake()->unique()->bothify('####??'),
            'size' => 'M',
            'color' => 'Beige',
            'color_hex' => '#E8DCC8',
            'stock_quantity' => 5,
            'is_active' => true,
        ];
    }
}
