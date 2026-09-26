<?php

namespace Database\Factories;

use App\Enums\ProductStatus;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Product> */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'slug' => fake()->unique()->slug(3),
            'currency' => 'THB',
            'price' => 59000,
            'status' => ProductStatus::Published,
            'published_at' => now()->subDay(),
            'badges' => [],
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(fn (Product $p) => $p->syncTranslations([
            'en' => ['name' => 'Linen Dress '.$p->id],
            'th' => ['name' => 'เดรสลินิน '.$p->id],
        ]));
    }
}
