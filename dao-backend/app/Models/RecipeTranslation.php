<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecipeTranslation extends Model
{
    protected $table = 'recipe_translations';

    public $timestamps = false;

    protected $guarded = ['id'];
}
