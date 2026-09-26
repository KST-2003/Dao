<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategoryTranslation extends Model
{
    protected $table = 'category_translations';

    public $timestamps = false;

    protected $guarded = ['id'];
}
