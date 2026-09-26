import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { qk } from '@/shared/constants/queryKeys';
import { useLocale } from '@/shared/hooks/useLocale';
import { analytics } from '@/shared/services/analytics/AnalyticsService';
import type { ContentType } from '@/types/enums';
import type { Comment, Paginated, VideoCard, VideoDetail } from '@/types/models';

export function useVideos(type?: ContentType, category?: string) {
  const locale = useLocale();
  return useInfiniteQuery({
    queryKey: qk.videos(type, category, locale),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.getRaw<Paginated<VideoCard>>('/videos', { params: { type, category, page: pageParam } }),
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
  });
}

export function useVideo(id: number) {
  const locale = useLocale();
  return useQuery({ queryKey: qk.video(id, locale), queryFn: () => api.get<VideoDetail>(`/videos/${id}`) });
}

export function useRelatedVideos(id: number) {
  return useQuery({ queryKey: qk.videoRelated(id), queryFn: () => api.get<VideoCard[]>(`/videos/${id}/related`) });
}

export function useComments(id: number) {
  return useInfiniteQuery({
    queryKey: qk.comments(id),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.getRaw<Paginated<Comment>>(`/videos/${id}/comments`, { params: { page: pageParam } }),
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
  });
}

export function usePostComment(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.post<Comment>(`/videos/${id}/comments`, { body }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.comments(id) }),
  });
}

export function useToggleLike(id: number) {
  const qc = useQueryClient();
  const locale = useLocale();
  return useMutation({
    mutationFn: (liked: boolean) => (liked ? api.post<{ liked: boolean; like_count: number }>(`/videos/${id}/like`) : api.delete<{ liked: boolean; like_count: number }>(`/videos/${id}/like`)),
    onMutate: (liked) => {
      qc.setQueryData<VideoDetail>(qk.video(id, locale), (v) => (v ? { ...v, is_liked: liked, like_count: v.like_count + (liked ? 1 : -1) } : v));
      if (liked) analytics.track('video_like', { video_id: id });
    },
    onSuccess: (res) => qc.setQueryData<VideoDetail>(qk.video(id, locale), (v) => (v ? { ...v, is_liked: res.liked, like_count: res.like_count } : v)),
    onError: () => void qc.invalidateQueries({ queryKey: qk.video(id, locale) }),
  });
}

export function recordView(id: number): void {
  analytics.track('video_view', { video_id: id });
  void api.post(`/videos/${id}/view`).catch(() => undefined);
}
