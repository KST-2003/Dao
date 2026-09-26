<?php

namespace App\Enums;

enum NotificationType: string
{
    case OrderUpdate = 'order_update';
    case NewDrop = 'new_drop';
    case MemberReward = 'member_reward';
    case PointsEarned = 'points_earned';
    case PointsExpiring = 'points_expiring';
    case TierUpgrade = 'tier_upgrade';
    case NewVlog = 'new_vlog';
    case NewRecipe = 'new_recipe';
    case Promotion = 'promotion';
    case VipEvent = 'vip_event';
}
