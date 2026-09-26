<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MembershipTierTranslation extends Model
{
    protected $table = 'membership_tier_translations';

    public $timestamps = false;

    protected $guarded = ['id'];

    protected $casts = ['benefits' => 'array'];
}
