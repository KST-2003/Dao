<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VideoTranslation extends Model
{
    protected $table = 'video_translations';

    public $timestamps = false;

    protected $guarded = ['id'];
}
