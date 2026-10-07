<?php

namespace App\Enums;

enum AdminPermission: string
{
    case All = '*';
    case DashboardView = 'dashboard.view';
    case ProductsManage = 'products.manage';
    case InventoryManage = 'inventory.manage';
    case OrdersView = 'orders.view';
    case OrdersManage = 'orders.manage';
    case CustomersView = 'customers.view';
    case CustomersManage = 'customers.manage';
    case LoyaltyManage = 'loyalty.manage';
    case MarketingManage = 'marketing.manage';
    case ContentManage = 'content.manage';
    case ReviewsModerate = 'reviews.moderate';
    case NotificationsSend = 'notifications.send';
    case SettingsManage = 'settings.manage';
    case AdminsManage = 'admins.manage';
    case AuditView = 'audit.view';
}
