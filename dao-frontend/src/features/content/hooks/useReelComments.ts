import { useState } from 'react';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { useComments, usePostComment } from '../api';

export function useReelComments(videoId: number, enabled: boolean) {
  const comments = useComments(videoId, enabled);
  const post = usePostComment(videoId);
  const requireAuth = useRequireAuth();
  const [text, setText] = useState('');
  return {
    comments: comments.data?.pages.flatMap((p) => p.data) ?? [],
    text,
    setText,
    post: requireAuth(() => text.trim() && post.mutate(text.trim(), { onSuccess: () => setText('') })),
  };
}
