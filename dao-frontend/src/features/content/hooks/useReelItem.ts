import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Share } from 'react-native';
import { api } from '@/shared/api/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToggleSaved } from '@/features/shop/api';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { analytics } from '@/shared/services/analytics/AnalyticsService';
import { useReelsUiStore } from '@/shared/store/reelsUiStore';
import { useIsSaved } from '@/shared/store/savedStore';
import { toast } from '@/shared/store/toastStore';
import type { VideoDetail } from '@/types/models';

/** Per-video state for a reel: optimistic like, save, share, and which sheet is open. */
export function useReelItem(video: VideoDetail, playing: boolean) {
  const qc = useQueryClient();
  const requireAuth = useRequireAuth();
  const toggleSaved = useToggleSaved();
  const saved = useIsSaved('video', video.id, video.is_saved);
  const [liked, setLiked] = useState(video.is_liked);
  const [likes, setLikes] = useState(video.like_count);
  const [sheet, setSheet] = useState<'comments' | 'products' | null>(null);
  const [paused, setPaused] = useState(false);

  const [burst, setBurst] = useState<{ x: number; y: number; key: number } | null>(null);
  const lastTap = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (tapTimer.current) clearTimeout(tapTimer.current); }, []);
  // While this reel is actually playing, tell the tab bar to fade; the cleanup restores it on pause, scroll or tab change.
  const setBarFaded = useReelsUiStore((s) => s.setPlaying);
  const live = playing && !!video.video_url && !paused;
  useEffect(() => {
    if (!live) return;
    setBarFaded(true);
    return () => setBarFaded(false);
  }, [live, setBarFaded]);
  // Scrolling back to a reel you paused starts it playing again.
  useEffect(() => { if (playing) setPaused(false); }, [playing]);

  const applyLike = (next: boolean) => {
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
  };
  const toggleLike = requireAuth(() => applyLike(!liked));
  // Double-tap only ever likes (like TikTok) — it never un-likes by accident.
  const doubleTapLike = requireAuth((x: number, y: number) => {
    setBurst({ x, y, key: Date.now() });
    if (!liked) applyLike(true);
  });

  /** One tap pauses/resumes; two quick taps like. The pause waits briefly so a double-tap doesn't flicker it. */
  const onTap = (x: number, y: number) => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      lastTap.current = 0;
      if (tapTimer.current) clearTimeout(tapTimer.current);
      doubleTapLike(x, y);
      return;
    }
    lastTap.current = now;
    tapTimer.current = setTimeout(() => {
      lastTap.current = 0;
      setPaused((p) => !p);
    }, 280);
  };

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
    onTap,
    burst,
    clearBurst: () => setBurst(null),
    openProduct: (id: number) => {
      setSheet(null);
      router.push({ pathname: '/product/[id]', params: { id: String(id) } });
    },
    signIn: () => router.push('/(auth)/login'),
  };
}
