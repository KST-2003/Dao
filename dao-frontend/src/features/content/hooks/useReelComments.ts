import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { toast } from '@/shared/store/toastStore';
import type { Comment } from '@/types/models';
import { useComments, usePostComment } from '../api';

export interface ReplyTarget {
  /** The comment being answered (may itself be a reply). */
  id: number;
  /** The top-level comment the reply lands under. */
  rootId: number;
  name: string;
}

/** The comment list for one video plus its composer: text, optional photo, and who is being replied to. */
export function useReelComments(videoId: number, enabled: boolean) {
  const { t } = useTranslation();
  const comments = useComments(videoId, enabled);
  const post = usePostComment(videoId);
  const requireAuth = useRequireAuth();
  const message = useErrorMessage();
  const [text, setText] = useState('');
  const [image, setImage] = useState<{ uri: string; contentType: string } | null>(null);
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.error(t('vlog.photoPermissionDenied'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    const asset = result.canceled ? null : result.assets[0];
    if (asset) {
      // The presign endpoint only accepts these three — anything else (e.g. HEIC) falls back to jpeg.
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      setImage({ uri: asset.uri, contentType: allowed.includes(asset.mimeType ?? '') ? (asset.mimeType as string) : 'image/jpeg' });
    }
  };

  const startReply = (c: Comment) => setReplyTo({ id: c.id, rootId: c.parent_id ?? c.id, name: c.user.name });

  const send = requireAuth(() => {
    const body = text.trim();
    if ((!body && !image) || post.isPending) {
      return;
    }
    post.mutate(
      { body, image: image ?? undefined, parentId: replyTo?.id, rootId: replyTo?.rootId },
      { onSuccess: () => { setText(''); setImage(null); setReplyTo(null); }, onError: (e) => toast.error(message(e)) },
    );
  });

  return {
    comments: comments.data?.pages.flatMap((p) => p.data) ?? [],
    text, setText, image, pickImage, clearImage: () => setImage(null),
    replyTo, startReply, cancelReply: () => setReplyTo(null),
    send, sending: post.isPending, canSend: Boolean(text.trim() || image),
  };
}
