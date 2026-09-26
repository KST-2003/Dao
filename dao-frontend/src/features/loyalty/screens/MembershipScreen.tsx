import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AsyncState, DAOCard, DAOHeader, DAOMemberBadge, DAOPointCard, DAOScreen, DAOStar, DAOText } from '@/shared/components';
import { useLocale } from '@/shared/hooks/useLocale';
import { formatDate, formatMoney, formatNumber } from '@/shared/utils/format';
import { useTheme } from '@/shared/theme';
import { useMembership } from '../api';

/** Tier, points, lifetime spend, progress and benefits — all from backend configuration. */
export default function MembershipScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { spacing, colors } = useTheme();
  const membership = useMembership();

  return (
    <DAOScreen header={<DAOHeader title={t('membership.title')} />} refreshing={membership.isRefetching} onRefresh={() => void membership.refetch()}>
      <AsyncState query={membership}>
        {(m) => (
          <View style={{ gap: spacing.xl }}>
            <DAOPointCard tier={m.tier} balance={m.balance} progress={m.progress} pointsToNext={m.points_to_next} nextTierName={m.next_tier?.name ?? null} />
            {m.next_tier && m.spend_to_next != null ? (
              <DAOText variant="bodySmall" tone="textMuted" align="center">{t('membership.spendUntil', { amount: formatMoney(m.spend_to_next), tier: m.next_tier.name ?? '' })}</DAOText>
            ) : null}
            <DAOCard style={{ gap: spacing.md }}>
              <DAOText variant="heading">{t('membership.benefits')}</DAOText>
              {m.tier.benefits.map((b) => (
                <View key={b} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                  <DAOStar size={10} />
                  <DAOText style={{ flex: 1 }}>{b}</DAOText>
                </View>
              ))}
              {m.member_since ? <DAOText variant="caption" tone="textSubtle">{t('membership.memberSince', { date: formatDate(m.member_since, locale) })}</DAOText> : null}
            </DAOCard>
            <View style={{ gap: spacing.md }}>
              <DAOText variant="heading">{t('membership.allTiers')}</DAOText>
              {m.tiers.map((tier) => {
                const current = tier.id === m.tier.id;
                return (
                  <DAOCard key={tier.id} muted={!current} style={{ gap: spacing.sm, borderWidth: current ? 1.5 : 0, borderColor: colors.gold }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <DAOMemberBadge tier={tier} />
                      {current ? <DAOText variant="caption" tone="gold">{t('membership.current')}</DAOText> : tier.min_points > 0 ? <DAOText variant="caption" tone="textMuted">{t('membership.from', { points: formatNumber(tier.min_points) })}</DAOText> : null}
                    </View>
                    {tier.benefits.slice(0, 4).map((b) => <DAOText key={b} variant="bodySmall" tone="textMuted">· {b}</DAOText>)}
                  </DAOCard>
                );
              })}
            </View>
          </View>
        )}
      </AsyncState>
    </DAOScreen>
  );
}
