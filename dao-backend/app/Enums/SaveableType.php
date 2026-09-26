<?php

namespace App\Enums;

use App\Models\Product;
use App\Models\Recipe;
use App\Models\Video;

enum SaveableType: string
{
    case Product = 'product';
    case Video = 'video';
    case Recipe = 'recipe';

    /** @return class-string<\Illuminate\Database\Eloquent\Model> */
    public function modelClass(): string
    {
        return match ($this) {
            self::Product => Product::class,
            self::Video => Video::class,
            self::Recipe => Recipe::class,
        };
    }
}
