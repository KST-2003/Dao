import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useCelebrationStore } from '@/shared/store/celebrationStore';
import { formatNumber } from '@/shared/utils/format';
import { useTheme } from '@/shared/theme';
import { DAOModal } from './DAOModal';
import { DAOStar } from './DAOStar';
import { DAOText } from './DAOText';

/** Points earned → gold star. Membership upgrade → DAO star. Subtle, not childish. */
export function DAOCelebration() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const current = useCelebrationStore((s) => s.current);
  const dismiss = useCelebrationStore((s) => s.dismiss);
  if (!current) {
    return null;
  }
  const title = current.kind === 'tier' ? t('membership.upgradeTitle') : t('home.greeting.pointsEarned', { points: formatNumber(current.points) });
  const message = current.kind === 'tier' ? t('membership.upgradeBody', { tier: current.tierName }) : undefined;
  return (
    <DAOModal visible onClose={dismiss} onConfirm={dismiss} confirmLabel={t('common.continue')}>
      <View style={{ alignItems: 'center', paddingVertical: spacing.md }}>
        <Animated.View entering={ZoomIn.duration(420)}>
          <DAOStar size={current.kind === 'tier' ? 72 : 48} twinkle />
        </Animated.View>
      </View>
      <DAOText variant="heading" align="center">{title}</DAOText>
      {message ? <DAOText tone="textMuted" align="center">{message}</DAOText> : null}
    </DAOModal>
  );
}
