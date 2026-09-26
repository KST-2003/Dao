<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RewardTranslation extends Model
{
    protected $table = 'reward_translations';

    public $timestamps = false;

    protected $guarded = ['id'];
}
