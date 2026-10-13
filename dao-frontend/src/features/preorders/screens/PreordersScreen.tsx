import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DAOChip, DAOEmptyState, DAOErrorState, DAOHeader, DAOImage, DAOText, ListSkeleton, OfflineBanner } from '@/shared/components';
import { useLocale } from '@/shared/hooks/useLocale';
import { formatDate, formatMoney } from '@/shared/utils/format';
import { useTheme } from '@/shared/theme';
import { PreorderStatusBadge } from '../components/PreorderStatusBadge';
import { PREORDER_TABS, usePreordersScreen } from '../hooks/usePreordersScreen';

export default function PreordersScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { colors, spacing, radius } = useTheme();
  const vm = usePreordersScreen();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DAOHeader title={t('preorders.title')} large />
      <OfflineBanner />
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.gutter, gap: spacing.sm, paddingBottom: spacing.md }}>
          {PREORDER_TABS.map((tab) => <DAOChip key={tab} label={t(`preorders.tabs.${tab}`)} selected={vm.tab === tab} onPress={() => vm.setTab(tab)} />)}
        </ScrollView>
      </View>
      <FlatList
        data={vm.list}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ paddingHorizontal: spacing.gutter, paddingBottom: spacing.huge, gap: spacing.md }}
        onEndReached={vm.loadMore}
        onRefresh={() => void vm.preorders.refetch()}
        refreshing={vm.preorders.isRefetching}
        ListEmptyComponent={vm.preorders.isPending ? <ListSkeleton /> : vm.preorders.isError ? <DAOErrorState error={vm.preorders.error} onRetry={() => void vm.preorders.refetch()} /> : <DAOEmptyState title={t('preorders.empty')} actionLabel={t('cart.exploreDao')} onAction={vm.explore} />}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" onPress={() => vm.open(item.id)} style={({ pressed }) => ({ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, opacity: pressed ? 0.92 : 1 })}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <DAOText variant="bodyMedium">{item.preorder_number}</DAOText>
              <PreorderStatusBadge status={item.status} />
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {(item.items ?? []).slice(0, 4).map((i) => (
                <View key={i.id} style={{ width: 52, borderRadius: radius.sm, overflow: 'hidden' }}><DAOImage uri={i.image_url} ratio={3 / 4} /></View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <DAOText variant="caption" tone="textMuted">{t('preorders.submittedOn', { date: formatDate(item.submitted_at, locale) })} · {t('orders.itemCount', { count: item.item_count ?? 0 })}</DAOText>
              <DAOText variant="price">{formatMoney(item.grand_total, item.currency)}</DAOText>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
