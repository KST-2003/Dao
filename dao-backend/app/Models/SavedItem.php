<?php

namespace App\Models;

use App\Enums\SaveableType;
use Illuminate\Database\Eloquent\Model;

class SavedItem extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['user_id', 'saveable_type', 'saveable_id'];

    protected function casts(): array
    {
        return ['saveable_type' => SaveableType::class, 'created_at' => 'datetime'];
    }
}
