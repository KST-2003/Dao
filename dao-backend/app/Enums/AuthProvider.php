<?php

namespace App\Enums;

enum AuthProvider: string
{
    case Google = 'google';
    case Line = 'line';
    case Sms = 'sms';
}
