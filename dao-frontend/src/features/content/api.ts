import * as FileSystem from 'expo-file-system/legacy';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { qk } from '@/shared/constants/queryKeys';
import { useLocale } from '@/shared/hooks/useLocale';
import { analytics } from '@/shared/services/analytics/AnalyticsService';
import type { ContentType } from '@/types/enums';
import type { Comment, Paginated, VideoCard, VideoCategory, VideoDetail } from '@/types/models';

export function useVideos(type?: ContentType, category?: string) {
  const locale = useLocale();
  return useInfiniteQuery({
    queryKey: qk.videos(type, category, locale),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.getRaw<Paginated<VideoCard>>('/videos', { params: { type, category, page: pageParam } }),
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
  });
}

/** Tabs for the reels feed, in the order the admin set. */
export function useVideoCategories() {
  const locale = useLocale();
  return useQuery({ queryKey: qk.videoCategories(locale), queryFn: () => api.get<VideoCategory[]>('/video-categories') });
}

/** Reels: full video payloads (playable URL, products, like state) so the next video plays without another request. */
export function useVideoFeed(category?: string) {
  const locale = useLocale();
  return useInfiniteQuery({
    queryKey: qk.videoFeed(category, locale),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.getRaw<Paginated<VideoDetail>>('/videos/feed', { params: { category, page: pageParam } }),
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

export function useComments(id: number, enabled = true) {
  return useInfiniteQuery({
    enabled,
    queryKey: qk.comments(id),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.getRaw<Paginated<Comment>>(`/videos/${id}/comments`, { params: { page: pageParam } }),
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
  });
}

export interface NewComment {
  body: string;
  /** Local file to upload (presigned PUT to storage) before the comment is posted. */
  image?: { uri: string; contentType: string };
  /** Top-level comment id the reply attaches to; the server flattens deeper replies onto it. */
  rootId?: number;
  /** The comment being answered (may itself be a reply), so the app can show "replying to". */
  parentId?: number;
}

export function usePostComment(videoId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ body, image, parentId }: NewComment) => {
      let key: string | undefined;
      if (image) {
        const presigned = await api.post<{ upload_url: string; key: string }>('/comments/image/presign', { content_type: image.contentType });
        const put = await FileSystem.uploadAsync(presigned.upload_url, image.uri, {
          httpMethod: 'PUT',
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          headers: { 'Content-Type': image.contentType },
        });
        if (put.status < 200 || put.status >= 300) {
          throw new Error('Upload to storage failed');
        }
        key = presigned.key;
      }
      return api.post<Comment>(`/videos/${videoId}/comments`, { body: body || undefined, image: key, parent_id: parentId });
    },
    onSuccess: (_c, vars) => {
      void qc.invalidateQueries({ queryKey: qk.comments(videoId) });
      if (vars.rootId) {
        void qc.invalidateQueries({ queryKey: qk.commentReplies(vars.rootId) });
      }
    },
  });
}

export function useCommentReplies(commentId: number, enabled: boolean) {
  return useInfiniteQuery({
    enabled,
    queryKey: qk.commentReplies(commentId),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.getRaw<Paginated<Comment>>(`/comments/${commentId}/replies`, { params: { page: pageParam } }),
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
  });
}

export function useToggleCommentLike() {
  return useMutation({
    mutationFn: ({ id, liked }: { id: number; liked: boolean }) => (liked ? api.post<{ like_count: number }>(`/comments/${id}/like`) : api.delete<{ like_count: number }>(`/comments/${id}/like`)),
  });
}

export function useDeleteComment(videoId: number, rootId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/comments/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.comments(videoId) });
      if (rootId) {
        void qc.invalidateQueries({ queryKey: qk.commentReplies(rootId) });
      }
    },
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

/** Server-checked (ContentAccessService) — rejects with VIDEO_DOWNLOAD_NOT_ALLOWED for a non-privileged user. */
export function useRequestVideoDownload(id: number) {
  return useMutation({ mutationFn: () => api.post<{ url: string }>(`/videos/${id}/download`) });
}
