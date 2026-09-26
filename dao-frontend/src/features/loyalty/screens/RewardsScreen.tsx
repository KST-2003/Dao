import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AsyncState, DAOButton, DAOCard, DAOChip, DAOHeader, DAOModal, DAOScreen, DAOStar, DAOText } from '@/shared/components';
import { useLocale } from '@/shared/hooks/useLocale';
import { formatDate, formatNumber } from '@/shared/utils/format';
import { useTheme } from '@/shared/theme';
import { useRewardsScreen } from '../hooks/useRewardsScreen';

export default function RewardsScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { spacing } = useTheme();
  const vm = useRewardsScreen();

  return (
    <DAOScreen header={<DAOHeader title={t('rewards.title')} large />}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
        <DAOChip label={t('rewards.title')} selected={vm.tab === 'rewards'} onPress={() => vm.setTab('rewards')} />
        <DAOChip label={t('rewards.myCoupons')} selected={vm.tab === 'coupons'} onPress={() => vm.setTab('coupons')} />
      </View>
      {vm.tab === 'rewards' ? (
        <AsyncState query={vm.rewards} isEmpty={(l) => l.length === 0} empty={{ title: t('rewards.noRewards') }}>
          {(list) => (
            <View style={{ gap: spacing.md }}>
              <DAOText tone="textMuted">{t('cart.pointsAvailable', { points: formatNumber(vm.balance) })}</DAOText>
              {list.map((r) => {
                const short = Math.max(0, r.points_cost - vm.balance);
                return (
                  <DAOCard key={r.id} style={{ gap: spacing.sm }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <DAOText variant="subheading" style={{ flex: 1 }}>{r.name}</DAOText>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><DAOStar size={11} /><DAOText variant="bodyMedium" tone="gold">{formatNumber(r.points_cost)}</DAOText></View>
                    </View>
                    {r.description ? <DAOText variant="bodySmall" tone="textMuted">{r.description}</DAOText> : null}
                    {short > 0 ? <DAOText variant="caption" tone="textSubtle">{t('rewards.notEnough', { points: formatNumber(short) })}</DAOText> : (
                      <DAOButton label={t('rewards.redeem')} variant="gold" size="sm" onPress={() => vm.ask(r)} style={{ alignSelf: 'flex-start' }} />
                    )}
                  </DAOCard>
                );
              })}
            </View>
          )}
        </AsyncState>
      ) : (
        <AsyncState query={vm.coupons} isEmpty={(l) => l.length === 0} empty={{ title: t('rewards.noCoupons') }}>
          {(list) => (
            <View style={{ gap: spacing.md }}>
              {list.map((c) => (
                <DAOCard key={c.id} onPress={() => void vm.copy(c.code)} style={{ gap: 4 }}>
                  <DAOText variant="heading" selectable>{c.code}</DAOText>
                  {c.description ? <DAOText variant="bodySmall" tone="textMuted">{c.description}</DAOText> : null}
                  {c.ends_at ? <DAOText variant="caption" tone="textSubtle">{t('rewards.validUntil', { date: formatDate(c.ends_at, locale) })}</DAOText> : null}
                </DAOCard>
              ))}
            </View>
          )}
        </AsyncState>
      )}
      <DAOModal visible={!!vm.pending} onClose={vm.close} title={vm.pending?.name ?? ''} message={vm.pending ? t('rewards.redeemConfirm', { points: formatNumber(vm.pending.points_cost) }) : ''}
        confirmLabel={t('rewards.redeem')} cancelLabel={t('common.cancel')} onConfirm={vm.confirm} loading={vm.redeeming} />
    </DAOScreen>
  );
}
