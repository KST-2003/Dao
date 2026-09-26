import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useToggleSaved, useHome } from '@/features/shop/api';
import { useNotificationsBadge } from '@/features/profile/api';
import { useAuthStore } from '@/shared/store/authStore';
import type { Banner, ProductCard } from '@/types/models';

const GREETINGS = ['home.greeting.new', 'home.greeting.returning', 'home.greeting.member', 'home.greeting.orderOnTheWay', 'home.greeting.pointsEarned'] as const;
type GreetingKey = (typeof GREETINGS)[number];

export function openBannerLink(banner: Banner): void {
  const link = banner.link;
  if (!link) return;
  switch (link.type) {
    case 'product': router.push({ pathname: '/product/[id]', params: { id: link.value } }); break;
    case 'collection': router.push({ pathname: '/collection/[slug]', params: { slug: link.value } }); break;
    case 'category': router.push({ pathname: '/category/[slug]', params: { slug: link.value } }); break;
    case 'video': router.push({ pathname: '/video/[id]', params: { id: link.value } }); break;
    case 'recipe': router.push({ pathname: '/recipe/[id]', params: { id: link.value } }); break;
    default: break;
  }
}

export function useHomeScreen() {
  const { t } = useTranslation();
  const home = useHome();
  const toggleSaved = useToggleSaved();
  const signedIn = useAuthStore((s) => s.status) === 'authenticated';
  const unread = useNotificationsBadge();

  const g = home.data?.greeting;
  const key: GreetingKey = g && (GREETINGS as readonly string[]).includes(g.key) ? (g.key as GreetingKey) : 'home.greeting.new';
  const params = Object.fromEntries(Object.entries(g?.params ?? {}).map(([k, v]) => [k, String(v)]));
  const greeting = String(t(key, params as never));

  return {
    home,
    greeting,
    greetingOrderId: g?.order_id,
    signedIn,
    unread,
    onToggleSave: (p: ProductCard) => toggleSaved('product', p.id, p.is_saved),
    openBanner: openBannerLink,
    goSearch: () => router.push('/search'),
    goNotifications: () => (signedIn ? router.push('/notifications') : router.push('/(auth)/login')),
    goShop: () => router.push('/(tabs)/shop'),
    goCollection: (slug: string) => router.push({ pathname: '/collection/[slug]', params: { slug } }),
    goVlog: () => router.push('/(tabs)/vlog'),
    goKitchen: () => router.push('/(tabs)/kitchen'),
    goMembership: () => (signedIn ? router.push('/membership') : router.push('/(auth)/login')),
    goOrder: (id: number) => router.push({ pathname: '/orders/[id]', params: { id: String(id) } }),
  };
}
