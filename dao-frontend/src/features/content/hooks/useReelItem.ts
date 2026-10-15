import { router } from 'expo-router';
import { useState } from 'react';
import { Share } from 'react-native';
import { api } from '@/shared/api/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToggleSaved } from '@/features/shop/api';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { analytics } from '@/shared/services/analytics/AnalyticsService';
import { useIsSaved } from '@/shared/store/savedStore';
import { toast } from '@/shared/store/toastStore';
import type { VideoDetail } from '@/types/models';

/** Per-video state for a reel: optimistic like, save, share, and which sheet is open. */
export function useReelItem(video: VideoDetail) {
  const qc = useQueryClient();
  const requireAuth = useRequireAuth();
  const toggleSaved = useToggleSaved();
  const saved = useIsSaved('video', video.id, video.is_saved);
  const [liked, setLiked] = useState(video.is_liked);
  const [likes, setLikes] = useState(video.like_count);
  const [sheet, setSheet] = useState<'comments' | 'products' | null>(null);
  const [paused, setPaused] = useState(false);

  const toggleLike = requireAuth(() => {
    const next = !liked;
    setLiked(next);
    setLikes((n) => Math.max(0, n + (next ? 1 : -1)));
    if (next) analytics.track('video_like', { video_id: video.id });
    const request = next ? api.post<{ like_count: number }>(`/videos/${video.id}/like`) : api.delete<{ like_count: number }>(`/videos/${video.id}/like`);
    request
      .then((r) => setLikes(r.like_count))
      .catch(() => {
        setLiked(!next);
        setLikes((n) => Math.max(0, n + (next ? -1 : 1)));
        toast.error('✕');
      })
      .finally(() => void qc.invalidateQueries({ queryKey: ['video', video.id] }));
  });

  return {
    liked,
    likes,
    saved,
    toggleLike,
    toggleSave: () => toggleSaved('video', video.id, saved),
    share: () => void Share.share({ message: `${video.title ?? 'DAO'} ✦ dao://video/${video.id}` }),
    sheet,
    openComments: () => setSheet('comments'),
    openProducts: () => setSheet('products'),
    closeSheet: () => setSheet(null),
    paused,
    togglePaused: () => setPaused((p) => !p),
    openProduct: (id: number) => {
      setSheet(null);
      router.push({ pathname: '/product/[id]', params: { id: String(id) } });
    },
    signIn: () => router.push('/(auth)/login'),
  };
}
