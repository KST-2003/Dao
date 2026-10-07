import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Share } from 'react-native';
import { useMe } from '@/features/auth/api';
import { useToggleSaved } from '@/features/shop/api';
import { useContentProtection } from '@/shared/hooks/useContentProtection';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { useSaveVideoToGallery } from '@/shared/hooks/useSaveVideoToGallery';
import { analytics } from '@/shared/services/analytics/AnalyticsService';
import { useIsSaved } from '@/shared/store/savedStore';
import { recordView, useComments, usePostComment, useRelatedVideos, useRequestVideoDownload, useToggleLike, useVideo } from '../api';

export function useVideoScreen() {
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  useContentProtection(`video-${id}`);
  const video = useVideo(id);
  const related = useRelatedVideos(id);
  const comments = useComments(id);
  const post = usePostComment(id);
  const like = useToggleLike(id);
  const toggleSaved = useToggleSaved();
  const requireAuth = useRequireAuth();
  const me = useMe();
  const requestDownload = useRequestVideoDownload(id);
  const gallery = useSaveVideoToGallery();
  const saved = useIsSaved('video', id, video.data?.is_saved ?? false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (video.data?.id) {
      recordView(video.data.id);
    }
  }, [video.data?.id]);

  return {
    video,
    related,
    comments: comments.data?.pages.flatMap((p) => p.data) ?? [],
    showComments,
    openComments: () => setShowComments(true),
    closeComments: () => setShowComments(false),
    comment,
    setComment,
    posting: post.isPending,
    postComment: requireAuth(() => comment.trim() && post.mutate(comment.trim(), { onSuccess: () => setComment('') })),
    toggleLike: requireAuth(() => video.data && like.mutate(!video.data.is_liked)),
    saved,
    toggleSave: () => toggleSaved('video', id, saved),
    share: () => void Share.share({ message: `${video.data?.title ?? 'DAO'} ✦ dao://video/${id}` }),
    onCompleted: () => analytics.track('video_completed', { video_id: id }),
    canDownload: me.data?.permissions?.can_download_videos ?? false,
    downloading: gallery.saving,
    downloadProgress: gallery.progress,
    downloadVideo: requireAuth(() => {
      analytics.track('video_download', { video_id: id });
      requestDownload.mutate(undefined, { onSuccess: (r) => void gallery.save(r.url) });
    }),
  };
}
