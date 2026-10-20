import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DAOBottomSheet, DAOIconButton, DAOImage, DAOInput, DAOText } from '@/shared/components';
import { hitSlop, useTheme } from '@/shared/theme';
import { useReelComments } from '../hooks/useReelComments';
import { CommentRow } from './CommentRow';

/** Comments for the playing video. Only mounted for the active reel, so nothing is fetched for the others. */
export function ReelCommentsSheet({ videoId, visible, onClose }: { videoId: number; visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const vm = useReelComments(videoId, visible);
  return (
    <DAOBottomSheet visible={visible} onClose={onClose} title={t('vlog.comments')}>
      <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.md }} keyboardShouldPersistTaps="handled">
        {vm.comments.length === 0 ? <DAOText tone="textMuted">{t('vlog.noComments')}</DAOText> : vm.comments.map((c) => (
          <CommentRow key={c.id} comment={c} videoId={videoId} onReply={vm.startReply} />
        ))}
      </ScrollView>
      {vm.replyTo ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
          <DAOText variant="caption" tone="textMuted">{t('vlog.replyingTo', { name: vm.replyTo.name })}</DAOText>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.cancel')} hitSlop={hitSlop} onPress={vm.cancelReply}><Feather name="x" size={16} color={colors.textMuted} /></Pressable>
        </View>
      ) : null}
      {vm.image ? (
        <View style={{ width: 72, marginBottom: spacing.xs }}>
          <View style={{ borderRadius: radius.md, overflow: 'hidden' }}><DAOImage uri={vm.image.uri} ratio={1} /></View>
          <Pressable accessibilityRole="button" accessibilityLabel={t('vlog.removePhoto')} hitSlop={hitSlop} onPress={vm.clearImage} style={{ position: 'absolute', top: 4, right: 4, backgroundColor: colors.scrim, borderRadius: 10, padding: 2 }}>
            <Feather name="x" size={14} color={colors.onPrimary} />
          </Pressable>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
        <DAOIconButton icon="image" tone="plain" accessibilityLabel={t('vlog.addPhoto')} onPress={() => void vm.pickImage()} />
        <View style={{ flex: 1 }}><DAOInput value={vm.text} onChangeText={vm.setText} placeholder={t('vlog.commentPlaceholder')} maxLength={1000} /></View>
        <DAOIconButton icon="send" tone="primary" accessibilityLabel={t('vlog.post')} onPress={vm.canSend && !vm.sending ? vm.send : undefined} style={{ opacity: vm.canSend && !vm.sending ? 1 : 0.5 }} />
      </View>
    </DAOBottomSheet>
  );
}
