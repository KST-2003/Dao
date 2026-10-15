import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { DAOText } from '@/shared/components';
import { media, useTheme } from '@/shared/theme';
import type { VideoCategory } from '@/types/models';

interface Props {
  categories: VideoCategory[];
  selected: string | null;
  onPick: (slug: string | null) => void;
}

/** Floating category tabs along the top of the reels (All + whatever admins configured). */
export function ReelCategoryTabs({ categories, selected, onPick }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { spacing } = useTheme();
  const tabs: { slug: string | null; name: string }[] = [{ slug: null, name: t('vlog.categories.all') }, ...categories];

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
      <LinearGradient pointerEvents="none" colors={[media.scrim, 'transparent']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 72 }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.gutter, gap: spacing.xl }}>
        {tabs.map((tab) => {
          const on = tab.slug === selected;
          return (
            <Pressable key={tab.slug ?? 'all'} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => onPick(tab.slug)} hitSlop={8} style={{ alignItems: 'center', gap: 4 }}>
              <DAOText variant={on ? 'bodyMedium' : 'bodySmall'} style={{ color: on ? media.text : media.textMuted, fontWeight: on ? '700' : '500' }}>{tab.name}</DAOText>
              <View style={{ height: 2, width: 20, borderRadius: 1, backgroundColor: on ? media.text : 'transparent' }} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
