import { View } from 'react-native';
import type { MembershipTier } from '@/types/models';
import { useTheme, media } from '@/shared/theme';
import { DAOStar } from './DAOStar';
import { DAOText } from './DAOText';

/** Tier chip. Color comes from the admin-configured tier, gold star for any paid tier. */
export function DAOMemberBadge({ tier, inverse }: { tier: Pick<MembershipTier, 'name' | 'color' | 'sort_order'>; inverse?: boolean }) {
  const { colors, radius, spacing } = useTheme();
  const fg = inverse ? media.text : tier.color ?? colors.primary;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.pill, borderWidth: 1, borderColor: fg }}>
      <DAOStar size={11} color={tier.sort_order > 0 ? colors.gold : fg} />
      <DAOText variant="overline" style={{ color: fg }}>{tier.name}</DAOText>
    </View>
  );
}
