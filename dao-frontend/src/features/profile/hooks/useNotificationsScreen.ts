import { router } from 'expo-router';
import type { AppNotification } from '@/types/models';
import { useMarkAllRead, useMarkNotificationRead, useNotifications } from '../api';

export function useNotificationsScreen() {
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();
  return {
    notifications,
    list: notifications.data?.pages.flatMap((p) => p.data) ?? [],
    unread: notifications.data?.pages[0]?.meta.unread ?? 0,
    markAll: () => markAll.mutate(),
    open: (n: AppNotification) => {
      if (!n.read_at) markRead.mutate(n.id);
      if (typeof n.data.route === 'string' && n.data.route.startsWith('/')) router.push(n.data.route as never);
    },
    loadMore: () => notifications.hasNextPage && !notifications.isFetchingNextPage && void notifications.fetchNextPage(),
  };
}
