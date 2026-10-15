import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DAOButton, DAOImage, DAOText } from '@/shared/components';
import { formatCount } from '@/shared/utils/format';
import { media, useTheme } from '@/shared/theme';
import type { VideoDetail } from '@/types/models';
import { useReelItem } from '../hooks/useReelItem';
import { ReelPlayer } from './ReelPlayer';
import { ReelCommentsSheet, ReelProductsSheet } from './ReelSheets';

function Rail({ icon, label, onPress, active, name }: { icon: keyof typeof Ionicons.glyphMap; label?: string; onPress: () => void; active?: boolean; name: string }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={name} onPress={onPress} hitSlop={6} style={{ alignItems: 'center', gap: 2, minWidth: 48 }}>
      <Ionicons name={icon} size={30} color={active ? colors.accent : media.text} />
      {label ? <DAOText variant="caption" style={{ color: media.text }}>{label}</DAOText> : null}
    </Pressable>
  );
}

interface Props {
  video: VideoDetail;
  height: number;
  /** The reel on screen (and the tab focused): only this one decodes video. */
  playing: boolean;
}

/** A full-screen reel: poster until it's the active one, then the live video, with the TikTok-style action rail. */
export function ReelItem({ video, height, playing }: Props) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const vm = useReelItem(video);
  const locked = !video.video_url; // members-only file withheld from guests

  return (
    <View style={{ height, backgroundColor: media.midnight }}>
      <DAOImage uri={video.thumbnail_url} style={{ position: 'absolute', width: '100%', height: '100%' }} />
      {playing && video.video_url ? <ReelPlayer uri={video.video_url} paused={vm.paused} /> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={vm.paused ? 'play' : 'pause'} onPress={vm.togglePaused} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        {vm.paused ? <Ionicons name="play" size={72} color={media.textMuted} /> : null}
      </Pressable>
      <LinearGradient pointerEvents="none" colors={['transparent', media.scrim]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 260 }} />

      {locked ? (
        <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: '42%', alignItems: 'center', gap: spacing.sm }}>
          <DAOText style={{ color: media.text }}>{video.is_members_only ? t('vlog.membersOnlyHint') : t('vlog.videoProcessing')}</DAOText>
          {video.is_members_only ? <DAOButton label={t('auth.signIn')} variant="gold" onPress={vm.signIn} /> : null}
        </View>
      ) : null}

      <View pointerEvents="box-none" style={{ position: 'absolute', right: spacing.md, bottom: spacing.xl, gap: spacing.xl }}>
        <Rail name={t('vlog.like')} icon={vm.liked ? 'heart' : 'heart-outline'} label={formatCount(vm.likes)} onPress={vm.toggleLike} active={vm.liked} />
        <Rail name={t('vlog.comments')} icon="chatbubble-ellipses-outline" label={formatCount(video.comment_count)} onPress={vm.openComments} />
        <Rail name={t('common.save')} icon={vm.saved ? 'bookmark' : 'bookmark-outline'} onPress={vm.toggleSave} active={vm.saved} />
        {video.shop_the_look.length > 0 ? <Rail name={t('shop.shopTheLook')} icon="bag-handle-outline" label={String(video.shop_the_look.length)} onPress={vm.openProducts} /> : null}
        <Rail name={t('vlog.share')} icon="arrow-redo-outline" onPress={vm.share} />
      </View>

      <View pointerEvents="none" style={{ position: 'absolute', left: spacing.gutter, right: 88, bottom: spacing.xl, gap: 4 }}>
        {video.title ? <DAOText variant="bodyMedium" numberOfLines={2} style={{ color: media.text }}>{video.title}</DAOText> : null}
        {video.description ? <DAOText variant="bodySmall" numberOfLines={2} style={{ color: media.textMuted }}>{video.description}</DAOText> : null}
        {video.tags.length > 0 ? <DAOText variant="caption" numberOfLines={1} style={{ color: media.textMuted }}>{video.tags.map((tag) => `#${tag}`).join(' ')}</DAOText> : null}
      </View>

      {playing ? <ReelCommentsSheet videoId={video.id} visible={vm.sheet === 'comments'} onClose={vm.closeSheet} /> : null}
      <ReelProductsSheet visible={vm.sheet === 'products'} products={video.shop_the_look} onClose={vm.closeSheet} onOpen={vm.openProduct} />
    </View>
  );
}
