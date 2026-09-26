<?php

namespace App\Enums;

enum ReferralStatus: string
{
    case Pending = 'pending';
    case Rewarded = 'rewarded';
    case Rejected = 'rejected';
}
