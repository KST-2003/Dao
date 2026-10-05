<?php

namespace App\Models;

use App\Casts\MediaUrl;
use Illuminate\Database\Eloquent\Model;

class RecipeStep extends Model
{
    public $timestamps = false;

    protected $fillable = ['step_number', 'instruction', 'image_url', 'timer_seconds'];

    protected function casts(): array
    {
        return ['instruction' => 'array', 'image_url' => MediaUrl::class];
    }
}
