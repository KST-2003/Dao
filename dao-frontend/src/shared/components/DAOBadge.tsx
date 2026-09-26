import { View } from 'react-native';
import { useTheme, media } from '@/shared/theme';
import { DAOStar } from './DAOStar';
import { DAOText } from './DAOText';

export type BadgeTone = 'sage' | 'rose' | 'gold' | 'neutral' | 'midnight';

export function DAOBadge({ label, tone = 'neutral', star }: { label: string; tone?: BadgeTone; star?: boolean }) {
  const { colors, radius, spacing } = useTheme();
  const map: Record<BadgeTone, { bg: string; fg: string }> = {
    sage: { bg: colors.primarySoft, fg: colors.primary },
    rose: { bg: colors.accentSoft, fg: colors.danger },
    gold: { bg: colors.goldSoft, fg: colors.gold },
    neutral: { bg: colors.surface, fg: colors.text },
    midnight: { bg: media.midnight, fg: media.pearl },
  };
  const c = map[tone];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: c.bg, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 }}>
      {star ? (
        <View style={{ marginRight: 4 }}>
          <DAOStar size={9} color={c.fg} />
        </View>
      ) : null}
      <DAOText variant="overline" style={{ color: c.fg, fontSize: 10 }}>
        {label}
      </DAOText>
    </View>
  );
}
