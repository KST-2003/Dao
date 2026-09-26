import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { qk } from '@/shared/constants/queryKeys';
import { useAuthStore } from '@/shared/store/authStore';
import type { AuthProvider, SaveableType } from '@/types/enums';
import type { AppNotification, Paginated, ProductCard, RecipeCard, User, VideoCard } from '@/types/models';

type SavedMap = { product: ProductCard; video: VideoCard; recipe: RecipeCard };

export function useSavedList<T extends SaveableType>(type: T) {
  const status = useAuthStore((s) => s.status);
  return useQuery({ queryKey: qk.saved(type), queryFn: () => api.get<SavedMap[T][]>(`/me/saved/${type}`), enabled: status === 'authenticated' });
}

export function useNotifications() {
  const status = useAuthStore((s) => s.status);
  return useInfiniteQuery({
    queryKey: qk.notifications,
    enabled: status === 'authenticated',
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.getRaw<Paginated<AppNotification, { unread: number }>>('/notifications', { params: { page: pageParam } }),
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
  });
}

/** Unread count for the bell dot (shares the notifications cache). */
export function useNotificationsBadge(): number {
  const q = useNotifications();
  return q.data?.pages[0]?.meta.unread ?? 0;
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/notifications/${id}/read`),
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.notifications }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.notifications }),
  });
}

export function useLinkProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ provider, body }: { provider: AuthProvider; body: Record<string, string> }) => api.post<User>(`/me/providers/${provider}`, body),
    onSuccess: (user) => qc.setQueryData(qk.me, user),
  });
}

export function useUnlinkProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: AuthProvider) => api.delete<User>(`/me/providers/${provider}`),
    onSuccess: (user) => qc.setQueryData(qk.me, user),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  const signOut = useAuthStore((s) => s.signOut);
  return useMutation({
    mutationFn: () => api.delete('/me'),
    onSuccess: async () => {
      await signOut();
      qc.clear();
    },
  });
}
