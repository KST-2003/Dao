import {
  Award, BadgePercent, BarChart3, Bell, Boxes, ChefHat, ClipboardList, FolderTree, Gift, Image, Layers, MessageSquareQuote,
  PlayCircle, Settings, ShieldCheck, ShoppingBag, Sparkles, Star, Users, type LucideIcon,
} from 'lucide-react'
import type { Permission } from '@/types/api'

export interface NavItem { to: string; label: string; icon: LucideIcon; perms: Permission[] }
export interface NavGroup { label: string; items: NavItem[] }

export const NAV: NavGroup[] = [
  { label: 'Overview', items: [{ to: '/', label: 'Dashboard', icon: BarChart3, perms: ['dashboard.view'] }] },
  {
    label: 'Commerce',
    items: [
      { to: '/orders', label: 'Orders', icon: ClipboardList, perms: ['orders.view', 'orders.manage'] },
      { to: '/products', label: 'Products', icon: ShoppingBag, perms: ['products.manage'] },
      { to: '/inventory', label: 'Inventory', icon: Boxes, perms: ['inventory.manage'] },
      { to: '/categories', label: 'Categories', icon: FolderTree, perms: ['products.manage'] },
      { to: '/collections', label: 'Collections', icon: Layers, perms: ['products.manage'] },
      { to: '/reviews', label: 'Reviews', icon: MessageSquareQuote, perms: ['reviews.moderate'] },
    ],
  },
  {
    label: 'Members',
    items: [
      { to: '/customers', label: 'Customers', icon: Users, perms: ['customers.view'] },
      { to: '/membership', label: 'Membership tiers', icon: Award, perms: ['loyalty.manage'] },
      { to: '/points', label: 'DAO Points', icon: Star, perms: ['loyalty.manage'] },
      { to: '/rewards', label: 'Rewards', icon: Gift, perms: ['loyalty.manage'] },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { to: '/coupons', label: 'Coupons', icon: BadgePercent, perms: ['marketing.manage'] },
      { to: '/banners', label: 'Banners', icon: Image, perms: ['marketing.manage'] },
      { to: '/notifications', label: 'Notifications', icon: Bell, perms: ['notifications.send'] },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/videos', label: 'Videos & Vlogs', icon: PlayCircle, perms: ['content.manage'] },
      { to: '/recipes', label: 'Kitchen recipes', icon: ChefHat, perms: ['content.manage'] },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/settings', label: 'Settings', icon: Settings, perms: ['settings.manage'] },
      { to: '/admin-users', label: 'Admin users', icon: ShieldCheck, perms: ['admins.manage'] },
      { to: '/audit-logs', label: 'Audit logs', icon: Sparkles, perms: ['audit.view'] },
    ],
  },
]
