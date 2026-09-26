import { FlatList, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  DAOChip, DAOEmptyState, DAOErrorState, DAOLilyMark, DAORecipeCard, DAOSectionHeader, DAOText, DAOVideoCard, OfflineBanner, ProductGridSkeleton,
} from '@/shared/components';
import { useTheme } from '@/shared/theme';
import { useKitchenScreen } from '../hooks/useKitchenScreen';

const KNOWN = ['curry', 'homemade', 'soup', 'snacks', 'drinks'] as const;
type Known = (typeof KNOWN)[number];

/** DAO Kitchen — a warm Thai lifestyle section inside DAO (not a restaurant app). */
export default function KitchenScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const vm = useKitchenScreen();
  const label = (c: string) => ((KNOWN as readonly string[]).includes(c) ? t(`kitchen.categories.${c as Known}`) : c);
  const feed = vm.kitchen.data;

  const header = (
    <View style={{ gap: spacing.lg, marginBottom: spacing.lg }}>
      <View style={{ marginHorizontal: spacing.gutter, backgroundColor: colors.primarySoft, borderRadius: radius.xl, padding: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        <View style={{ flex: 1, gap: 4 }}>
          <DAOText variant="display" accessibilityRole="header">{t('kitchen.title')}</DAOText>
          <DAOText tone="textMuted" italic>{t('kitchen.subtitle')}</DAOText>
        </View>
        <DAOLilyMark size={56} />
      </View>
      {feed?.todays_kitchen.length ? (
        <View>
          <DAOSectionHeader title={t('kitchen.todaysKitchen')} />
          <FlatList horizontal data={feed.todays_kitchen} keyExtractor={(r) => String(r.id)} showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.gutter, gap: spacing.md }} renderItem={({ item }) => <DAORecipeCard recipe={item} width={220} />} />
        </View>
      ) : null}
      {feed?.tutorials.length ? (
        <View>
          <DAOSectionHeader title={t('kitchen.tutorials')} />
          <FlatList horizontal data={feed.tutorials} keyExtractor={(v) => String(v.id)} showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.gutter, gap: spacing.md }} renderItem={({ item }) => <DAOVideoCard video={item} width={150} tall />} />
        </View>
      ) : null}
      <DAOSectionHeader title={t('kitchen.recipes')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.gutter, gap: spacing.sm }}>
        <DAOChip label={t('kitchen.categories.all')} selected={!vm.category} onPress={() => vm.setCategory(undefined)} />
        {vm.categories.map((c) => <DAOChip key={c} label={label(c)} selected={vm.category === c} onPress={() => vm.setCategory(c)} />)}
      </ScrollView>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 8 }}>
      <OfflineBanner />
      <FlatList
        data={vm.list}
        keyExtractor={(r) => String(r.id)}
        numColumns={2}
        ListHeaderComponent={header}
        columnWrapperStyle={{ paddingHorizontal: spacing.gutter, gap: spacing.md, marginBottom: spacing.lg }}
        renderItem={({ item }) => <View style={{ flex: 1, maxWidth: '50%' }}><DAORecipeCard recipe={item} /></View>}
        onEndReached={vm.loadMore}
        onRefresh={vm.refresh}
        refreshing={vm.recipes.isRefetching}
        ListEmptyComponent={vm.recipes.isPending ? <ProductGridSkeleton /> : vm.recipes.isError ? <DAOErrorState error={vm.recipes.error} onRetry={vm.refresh} /> : <DAOEmptyState title={t('kitchen.empty')} />}
        contentContainerStyle={{ paddingBottom: spacing.huge }}
      />
    </View>
  );
}
