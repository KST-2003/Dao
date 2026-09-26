<?php

namespace App\Enums;

/** One video/content system for every kind of creator content. */
enum ContentType: string
{
    case Vlog = 'vlog';
    case Recipe = 'recipe';
    case Fashion = 'fashion';
    case Tutorial = 'tutorial';
    case Short = 'short';
}
