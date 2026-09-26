<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Category> */
class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition(): array
    {
        return ['slug' => fake()->unique()->slug(2), 'is_active' => true, 'sort_order' => 0];
    }

    public function configure(): static
    {
        return $this->afterCreating(fn (Category $c) => $c->syncTranslations(['en' => ['name' => ucfirst($c->slug)]]));
    }
}
