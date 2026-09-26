import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DAOButton, DAOCard, DAOEmptyState, DAOErrorState, DAOHeader, DAOStar, DAOText, ListSkeleton } from '@/shared/components';
import { useLocale } from '@/shared/hooks/useLocale';
import { formatDate, formatMoney, formatNumber } from '@/shared/utils/format';
import { useTheme } from '@/shared/theme';
import { usePointsScreen } from '../hooks/usePointsScreen';

/** DAO Points balance + ledger history (every earn, redeem, expiry and reversal). */
export default function PointsScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { colors, spacing } = useTheme();
  const vm = usePointsScreen();

  const header = vm.meta ? (
    <View style={{ gap: spacing.lg, marginBottom: spacing.xl }}>
      <DAOCard style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl }}>
        <DAOStar size={28} twinkle />
        <DAOText variant="display">{formatNumber(vm.meta.balance)}</DAOText>
        <DAOText tone="textMuted">{t('points.balance')}</DAOText>
        <DAOText variant="caption" tone="gold">{t('points.redeemRate', { points: formatNumber(vm.meta.redeem.points_unit), amount: formatMoney(vm.meta.redeem.value_per_unit) })}</DAOText>
        {vm.meta.expiring_within_30_days > 0 ? <DAOText variant="caption" tone="danger">{t('points.expiring', { points: formatNumber(vm.meta.expiring_within_30_days) })}</DAOText> : null}
      </DAOCard>
      <DAOButton label={t('rewards.title')} icon="gift" variant="secondary" fullWidth onPress={vm.goRewards} />
      <DAOText variant="heading">{t('points.history')}</DAOText>
    </View>
  ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DAOHeader title={t('points.title')} />
      <FlatList
        data={vm.list}
        keyExtractor={(tx) => String(tx.id)}
        ListHeaderComponent={header}
        onEndReached={vm.loadMore}
        onRefresh={() => void vm.points.refetch()}
        refreshing={vm.points.isRefetching}
        contentContainerStyle={{ paddingHorizontal: spacing.gutter, paddingBottom: spacing.huge }}
        ListEmptyComponent={vm.points.isPending ? <ListSkeleton /> : vm.points.isError ? <DAOErrorState error={vm.points.error} onRetry={() => void vm.points.refetch()} /> : <DAOEmptyState title={t('points.empty')} />}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
            <View style={{ flex: 1, gap: 2 }}>
              <DAOText variant="bodyMedium">{t(`points.types.${item.type}`)}</DAOText>
              <DAOText variant="caption" tone="textMuted">{[item.description, formatDate(item.created_at, locale)].filter(Boolean).join(' · ')}</DAOText>
            </View>
            <DAOText variant="subheading" tone={item.points > 0 ? 'gold' : 'textMuted'}>{item.points > 0 ? '+' : ''}{formatNumber(item.points)}</DAOText>
          </View>
        )}
      />
    </View>
  );
}
