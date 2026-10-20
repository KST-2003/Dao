import { Feather, Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DAOAvatar, DAOImage, DAOText } from '@/shared/components';
import { hitSlop, useTheme } from '@/shared/theme';
import type { Comment } from '@/types/models';
import { useCommentRow } from '../hooks/useCommentRow';

interface Props {
  comment: Comment;
  videoId: number;
  onReply: (c: Comment) => void;
  /** Replies are drawn smaller and cannot be expanded further (one level, like TikTok). */
  isReply?: boolean;
}

export function CommentRow({ comment, videoId, onReply, isReply = false }: Props) {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const vm = useCommentRow(comment, videoId);
  const banned = comment.status === 'banned';
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <DAOAvatar name={comment.user.name} uri={comment.user.avatar_url} size={isReply ? 24 : 32} />
        <View style={{ flex: 1, gap: 2 }}>
          <DAOText variant="caption" tone="textMuted">
            {comment.user.name}{comment.reply_to ? ` ▸ ${comment.reply_to}` : ''}
          </DAOText>
          {banned ? (
            <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }}>
              <Feather name="slash" size={14} color={colors.danger} />
              <View style={{ flex: 1 }}>
                <DAOText variant="bodySmall" tone="danger">{t('vlog.commentBanned')}</DAOText>
                <DAOText variant="caption" tone="textSubtle">{t('vlog.commentBannedHint')}</DAOText>
              </View>
            </View>
          ) : (
            <>
              {comment.body ? <DAOText variant="bodySmall">{comment.body}</DAOText> : null}
              {comment.image_url ? <View style={{ width: 168, borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.xs }}><DAOImage uri={comment.image_url} ratio={1} /></View> : null}
            </>
          )}
          <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: 2 }}>
            {banned ? null : <Pressable accessibilityRole="button" hitSlop={hitSlop} onPress={() => onReply(comment)}><DAOText variant="caption" tone="textMuted">{t('vlog.reply')}</DAOText></Pressable>}
            {comment.is_mine ? <Pressable accessibilityRole="button" hitSlop={hitSlop} onPress={vm.confirmDelete}><DAOText variant="caption" tone="textMuted">{t('vlog.deleteComment')}</DAOText></Pressable> : null}
          </View>
        </View>
        {banned ? null : (
          <Pressable accessibilityRole="button" accessibilityLabel={t('vlog.likeComment')} accessibilityState={{ selected: vm.liked }} hitSlop={hitSlop} onPress={vm.toggleLike} style={{ alignItems: 'center', minWidth: 28 }}>
            <Ionicons name={vm.liked ? 'heart' : 'heart-outline'} size={18} color={vm.liked ? colors.accent : colors.textMuted} />
            {vm.likeCount > 0 ? <DAOText variant="caption" tone="textMuted">{vm.likeCount}</DAOText> : null}
          </Pressable>
        )}
      </View>
      {isReply || comment.reply_count === 0 ? null : (
        <View style={{ marginLeft: 32 + spacing.sm, gap: spacing.md }}>
          <Pressable accessibilityRole="button" hitSlop={hitSlop} onPress={vm.toggleReplies}>
            <DAOText variant="caption" tone="textMuted">{vm.open ? t('vlog.hideReplies') : t('vlog.viewReplies', { count: comment.reply_count })}</DAOText>
          </Pressable>
          {vm.open ? vm.replies.map((r) => <CommentRow key={r.id} comment={r} videoId={videoId} onReply={onReply} isReply />) : null}
          {vm.open && vm.hasMoreReplies ? <Pressable accessibilityRole="button" hitSlop={hitSlop} onPress={vm.loadMoreReplies}><DAOText variant="caption" tone="primary">{t('vlog.viewMoreReplies')}</DAOText></Pressable> : null}
        </View>
      )}
    </View>
  );
}
