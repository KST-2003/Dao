import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { VideoCard } from '@/types/models';
import { formatCount, formatDuration } from '@/shared/utils/format';
import { ratios, useTheme, media, gradients } from '@/shared/theme';
import { DAOImage } from './DAOImage';
import { DAOText } from './DAOText';

export function DAOVideoCard({ video, width, tall }: { video: VideoCard; width?: number; tall?: boolean }) {
  const { t } = useTranslation();
  const { radius, spacing } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={video.title ?? ''}
      onPress={() => router.push({ pathname: '/video/[id]', params: { id: String(video.id) } })}
      style={({ pressed }) => [{ width, opacity: pressed ? 0.94 : 1 }]}
    >
      <View style={{ borderRadius: radius.lg, overflow: 'hidden' }}>
        <DAOImage uri={video.thumbnail_url} ratio={tall ? ratios.video : ratios.videoCard} />
        <LinearGradient colors={gradients.photoFade} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%' }} />
        <View style={{ position: 'absolute', top: spacing.sm, right: spacing.sm, backgroundColor: media.chip, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 }}>
          <DAOText variant="caption" style={{ color: media.text }}>{formatDuration(video.duration_seconds)}</DAOText>
        </View>
        <View style={{ position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="play" size={12} color={media.text} />
            <DAOText variant="caption" style={{ color: media.textMuted }}>{t('vlog.views', { views: formatCount(video.view_count) })}</DAOText>
          </View>
          <DAOText variant="bodyMedium" numberOfLines={2} style={{ color: media.text }}>{video.title}</DAOText>
        </View>
      </View>
    </Pressable>
  );
}
