import { FlatList, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { DAOChip, DAOEmptyState, DAOErrorState, DAOText, DAOVideoCard, OfflineBanner, ProductGridSkeleton } from '@/shared/components';
import { useTheme } from '@/shared/theme';
import { VLOG_CATEGORIES, useVlogScreen } from '../hooks/useVlogScreen';

/** Dao's personal creator channel. */
export default function VlogScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const vm = useVlogScreen();

  const header = (
    <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
      <View style={{ paddingHorizontal: spacing.gutter }}>
        <DAOText variant="display" accessibilityRole="header">{t('vlog.title')}</DAOText>
        <DAOText tone="textMuted" italic>{t('vlog.subtitle')}</DAOText>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.gutter, gap: spacing.sm }}>
        {VLOG_CATEGORIES.map((c) => <DAOChip key={c} label={t(`vlog.categories.${c}`)} selected={vm.category === c} onPress={() => vm.setCategory(c)} />)}
      </ScrollView>
      {vm.featured ? <View style={{ paddingHorizontal: spacing.gutter }}><DAOVideoCard video={vm.featured} /></View> : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 8 }}>
      <OfflineBanner />
      <FlatList
        data={vm.rest}
        keyExtractor={(v) => String(v.id)}
        numColumns={2}
        ListHeaderComponent={header}
        columnWrapperStyle={{ paddingHorizontal: spacing.gutter, gap: spacing.md, marginBottom: spacing.lg }}
        renderItem={({ item }) => <View style={{ flex: 1, maxWidth: '50%' }}><DAOVideoCard video={item} tall /></View>}
        onEndReached={vm.loadMore}
        onRefresh={() => void vm.videos.refetch()}
        refreshing={vm.videos.isRefetching}
        ListEmptyComponent={vm.videos.isPending ? <ProductGridSkeleton /> : vm.videos.isError ? <DAOErrorState error={vm.videos.error} onRetry={() => void vm.videos.refetch()} /> : vm.featured ? null : <DAOEmptyState title={t('vlog.empty')} />}
        contentContainerStyle={{ paddingBottom: spacing.huge }}
      />
    </View>
  );
}
