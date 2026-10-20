<?php

namespace App\Enums;

enum CommentStatus: string
{
    case Visible = 'visible';
    case Banned = 'banned';
}
