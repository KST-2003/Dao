import { useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { toast } from '@/shared/store/toastStore';
import type { Comment } from '@/types/models';
import { useCommentReplies, useDeleteComment, useToggleCommentLike } from '../api';

/** One comment: optimistic like, expandable replies (top-level only) and delete-own. */
export function useCommentRow(comment: Comment, videoId: number) {
  const { t } = useTranslation();
  const requireAuth = useRequireAuth();
  const message = useErrorMessage();
  const [liked, setLiked] = useState(comment.is_liked);
  const [likeCount, setLikeCount] = useState(comment.like_count);
  const [open, setOpen] = useState(false);
  const like = useToggleCommentLike();
  const replies = useCommentReplies(comment.id, open);
  const remove = useDeleteComment(videoId, comment.parent_id);

  const toggleLike = requireAuth(() => {
    const next = !liked;
    setLiked(next);
    setLikeCount((n) => Math.max(0, n + (next ? 1 : -1)));
    like.mutate({ id: comment.id, liked: next }, {
      onSuccess: (r) => setLikeCount(r.like_count),
      onError: (e) => { setLiked(!next); setLikeCount((n) => Math.max(0, n + (next ? -1 : 1))); toast.error(message(e)); },
    });
  });

  const confirmDelete = () => Alert.alert(t('vlog.deleteCommentTitle'), t('vlog.deleteCommentBody'), [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('vlog.deleteComment'), style: 'destructive', onPress: () => remove.mutate(comment.id, { onError: (e) => toast.error(message(e)) }) },
  ]);

  return {
    liked, likeCount, toggleLike,
    open, toggleReplies: () => setOpen((v) => !v),
    replies: replies.data?.pages.flatMap((p) => p.data) ?? [],
    hasMoreReplies: Boolean(replies.hasNextPage), loadMoreReplies: () => void replies.fetchNextPage(),
    confirmDelete,
  };
}
