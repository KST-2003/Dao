<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BannerTranslation extends Model
{
    protected $table = 'banner_translations';

    public $timestamps = false;

    protected $guarded = ['id'];
}
