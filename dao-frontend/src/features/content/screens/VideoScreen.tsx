import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  AsyncState, DAOAvatar, DAOBottomSheet, DAOButton, DAOIconButton, DAOImage, DAOInput, DAOProductCard, DAOSectionHeader,
  DAOText, DAOVideoCard,
} from '@/shared/components';
import { formatCount } from '@/shared/utils/format';
import { ratios, useTheme, media } from '@/shared/theme';
import { VideoPlayer } from '../components/VideoPlayer';
import { useVideoScreen } from '../hooks/useVideoScreen';

function Action({ icon, label, onPress, active }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; active?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ alignItems: 'center', gap: 2, minWidth: 56 }}>
      <Ionicons name={icon} size={22} color={active ? colors.accent : colors.text} />
      <DAOText variant="caption" tone="textMuted">{label}</DAOText>
    </Pressable>
  );
}

export default function VideoScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const vm = useVideoScreen();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/*
        This screen always has dark video content directly under the status bar (the route's
        contentStyle is media.midnight — see _layout.tsx), unlike Shop/Vlog/Kitchen which sit
        over the normal light app background. The global <StatusBar> in _layout.tsx follows
        the day/night theme, not screen content, so its icon color was wrong here regardless
        of theme — forcing light icons while this screen is mounted; expo-status-bar stacks
        multiple <StatusBar> instances and reverts to the previous one on unmount.
      */}
      <StatusBar style="light" />
      <AsyncState query={vm.video}>
        {(v) => (
          <ScrollView contentContainerStyle={{ paddingBottom: spacing.huge }}>
            <View>
              {v.video_url ? <VideoPlayer uri={v.video_url} poster={v.thumbnail_url} onCompleted={vm.onCompleted} /> : (
                <View>
                  <DAOImage uri={v.thumbnail_url} ratio={ratios.video} />
                  <View style={{ position: 'absolute', left: 0, right: 0, bottom: spacing.xxxl, alignItems: 'center', gap: spacing.sm }}>
                    <DAOText style={{ color: media.text }}>{v.is_members_only ? t('vlog.membersOnlyHint') : t('vlog.videoProcessing')}</DAOText>
                    {v.is_members_only ? <DAOButton label={t('auth.signIn')} variant="gold" onPress={() => router.push('/(auth)/login')} /> : null}
                  </View>
                </View>
              )}
            </View>
            <View style={{ padding: spacing.gutter, gap: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <DAOAvatar name={v.author.name} uri={v.author.avatar_url} size={40} />
                <View style={{ flex: 1 }}>
                  <DAOText variant="bodyMedium">{v.author.name}</DAOText>
                  <DAOText variant="caption" tone="textMuted">{t('vlog.views', { views: formatCount(v.view_count) })}</DAOText>
                </View>
              </View>
              <DAOText variant="title">{v.title}</DAOText>
              {v.description ? <DAOText tone="textMuted">{v.description}</DAOText> : null}
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: spacing.sm, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.divider }}>
                <Action icon={v.is_liked ? 'heart' : 'heart-outline'} label={formatCount(v.like_count)} onPress={vm.toggleLike} active={v.is_liked} />
                <Action icon="chatbubble-outline" label={formatCount(v.comment_count)} onPress={vm.openComments} />
                <Action icon={vm.saved ? 'bookmark' : 'bookmark-outline'} label={t('common.save')} onPress={vm.toggleSave} active={vm.saved} />
                <Action icon="share-outline" label={t('vlog.share')} onPress={vm.share} />
                {vm.canDownload ? (
                  <Action icon="download-outline" active={vm.downloading}
                    label={vm.downloading ? t('vlog.downloading', { percent: String(vm.downloadProgress) }) : t('vlog.download')}
                    onPress={() => !vm.downloading && vm.downloadVideo()} />
                ) : null}
              </View>
            </View>
            {v.shop_the_look.length > 0 ? (
              <View style={{ marginTop: spacing.md }}>
                <DAOSectionHeader title={t('shop.shopTheLook')} />
                <FlatList horizontal data={v.shop_the_look} keyExtractor={(p) => String(p.id)} showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: spacing.gutter, gap: spacing.md }} renderItem={({ item }) => <DAOProductCard product={item} width={140} />} />
              </View>
            ) : null}
            {(vm.related.data?.length ?? 0) > 0 ? (
              <View style={{ marginTop: spacing.xxl }}>
                <DAOSectionHeader title={t('vlog.related')} />
                <FlatList horizontal data={vm.related.data} keyExtractor={(x) => String(x.id)} showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: spacing.gutter, gap: spacing.md }} renderItem={({ item }) => <DAOVideoCard video={item} width={150} />} />
              </View>
            ) : null}
          </ScrollView>
        )}
      </AsyncState>
      <DAOBottomSheet visible={vm.showComments} onClose={vm.closeComments} title={t('vlog.comments')}>
        <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.md }}>
          {vm.comments.length === 0 ? <DAOText tone="textMuted">{t('vlog.noComments')}</DAOText> : vm.comments.map((c) => (
            <View key={c.id} style={{ flexDirection: 'row', gap: spacing.sm }}>
              <DAOAvatar name={c.user.name} uri={c.user.avatar_url} size={30} />
              <View style={{ flex: 1 }}>
                <DAOText variant="caption" tone="textMuted">{c.user.name}</DAOText>
                <DAOText variant="bodySmall">{c.body}</DAOText>
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <View style={{ flex: 1 }}><DAOInput value={vm.comment} onChangeText={vm.setComment} placeholder={t('vlog.commentPlaceholder')} maxLength={1000} /></View>
          <DAOIconButton icon="send" tone="primary" accessibilityLabel={t('vlog.post')} onPress={vm.postComment} />
        </View>
      </DAOBottomSheet>
      {/*
        Fixed top navbar, deliberately OUTSIDE AsyncState and the scrolling content:
        - Always on screen, including while the video is loading or failed to load (it used
          to live inside AsyncState's success branch only, so there was no way back during
          loading, and the default loading state is a plain skeleton with nothing in it).
        - Rendered as the very last sibling in the whole screen (React Native paints later
          siblings on top), not nested alongside the video, so it can't end up underneath
          the native video surface the way a sibling nested in the same row could.
        - Pinned to the screen with pointerEvents="box-none" so only the button itself
          intercepts touches; scrolling the content underneath still works.
      */}
      <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <LinearGradient pointerEvents="none" colors={[media.scrim, 'transparent']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 56 }} />
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: spacing.gutter }}>
          <DAOIconButton icon="chevron-left" tone="glass" accessibilityLabel={t('common.back')} onPress={() => router.back()} />
        </View>
      </View>
    </View>
  );
}
