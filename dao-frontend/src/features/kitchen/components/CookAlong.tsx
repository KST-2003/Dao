import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { VideoView } from 'expo-video';
import { DAOImage, DAOText } from '@/shared/components';
import { ReelProgress } from '@/features/content/components/ReelProgress';
import { media, ratios, useTheme } from '@/shared/theme';
import { formatDuration } from '@/shared/utils/format';
import type { RecipeDetail } from '@/types/models';
import { useCookAlong } from '../hooks/useCookAlong';

/**
 * The cooking video with the current step as a caption, a draggable seek bar marked at every step, and the step list
 * underneath: tapping a step jumps the video to that moment.
 */
export function CookAlong({ recipe, uri, startAt, topInset }: { recipe: RecipeDetail; uri: string; startAt: number; topInset: number }) {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const vm = useCookAlong(uri, recipe.steps, startAt);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: media.midnight, paddingTop: topInset }}>
        <View style={{ width: '100%', aspectRatio: ratios.video }}>
          <VideoView player={vm.player} style={{ width: '100%', height: '100%' }} contentFit="cover" nativeControls={false} />
          <Pressable accessibilityRole="button" onPress={vm.toggle} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
            {vm.isPlaying ? null : (
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: media.textMuted, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="play" size={26} color={media.glassIcon} />
              </View>
            )}
          </Pressable>
          {vm.current ? (
            <View pointerEvents="none" style={{ position: 'absolute', left: spacing.md, right: spacing.md, bottom: 44, alignItems: 'center' }}>
              <View style={{ backgroundColor: media.scrim, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
                <DAOText variant="overline" style={{ color: media.gold }}>{t('kitchen.step', { number: String(vm.current.number) })}</DAOText>
                <DAOText variant="bodySmall" style={{ color: media.text }}>{vm.current.instruction}</DAOText>
              </View>
            </View>
          ) : null}
          <ReelProgress player={vm.player} marks={vm.marks} />
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.gutter, gap: spacing.md }}>
        <DAOText variant="title">{recipe.title}</DAOText>
        {recipe.steps.map((s) => {
          const active = vm.current?.number === s.number;
          const seconds = s.video_seconds;
          return (
            <Pressable
              key={s.number}
              accessibilityRole="button"
              accessibilityLabel={seconds == null ? undefined : t('kitchen.jumpToStep')}
              disabled={seconds == null}
              onPress={() => seconds != null && vm.seekTo(seconds)}
              style={{ flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: active ? colors.primarySoft : 'transparent' }}
            >
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: active ? colors.primary : colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <DAOText variant="caption" style={{ color: active ? colors.onPrimary : colors.primary }}>{s.number}</DAOText>
              </View>
              <View style={{ flex: 1, gap: spacing.xs }}>
                {seconds != null ? <DAOText variant="caption" tone="primary">{formatDuration(seconds)}</DAOText> : null}
                <DAOText>{s.instruction}</DAOText>
                {s.image_url ? <DAOImage uri={s.image_url} ratio={ratios.recipe} style={{ borderRadius: radius.md }} /> : null}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
