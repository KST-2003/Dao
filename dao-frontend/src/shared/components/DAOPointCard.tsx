import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import type { MembershipTier } from '@/types/models';
import { formatNumber } from '@/shared/utils/format';
import { useTheme, media, gradients } from '@/shared/theme';
import { DAOMemberBadge } from './DAOMemberBadge';
import { DAOStar } from './DAOStar';
import { DAOText } from './DAOText';

interface Props {
  tier: MembershipTier;
  balance: number;
  progress: number;
  pointsToNext: number | null;
  nextTierName: string | null;
  onPress?: () => void;
}

/** DAO membership card: tier, points, progress to next tier. Premium tiers render in Midnight. */
export function DAOPointCard({ tier, balance, progress, pointsToNext, nextTierName, onPress }: Props) {
  const { t } = useTranslation();
  const { radius, spacing, shadows } = useTheme();
  const premium = tier.sort_order >= 20;
  const gradient = premium ? gradients.premium : gradients.member;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${tier.name ?? ''} ${formatNumber(balance)}`} onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.95 : 1 }, shadows.card]}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: radius.xl, padding: spacing.xl, gap: spacing.md, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', right: -10, top: -8, opacity: 0.18 }}>
          <DAOStar size={120} color={media.gold} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <DAOMemberBadge tier={tier} inverse />
          <DAOStar size={16} twinkle />
        </View>
        <View>
          <DAOText variant="display" style={{ color: media.text }}>{formatNumber(balance)}</DAOText>
          <DAOText variant="bodySmall" style={{ color: media.textMuted }}>{t('brand.points')}</DAOText>
        </View>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: media.track, overflow: 'hidden' }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}>
          <View style={{ width: `${Math.round(progress * 100)}%`, height: 4, backgroundColor: media.gold }} />
        </View>
        <DAOText variant="caption" style={{ color: media.textMuted }}>
          {nextTierName && pointsToNext != null ? t('membership.pointsUntil', { points: formatNumber(pointsToNext), tier: nextTierName }) : t('membership.topTier')}
        </DAOText>
      </LinearGradient>
    </Pressable>
  );
}
