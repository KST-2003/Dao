import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useIsOnline } from '@/shared/hooks/useIsOnline';
import { useTheme } from '@/shared/theme';
import { DAOText } from './DAOText';

export function OfflineBanner() {
  const online = useIsOnline();
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  if (online) {
    return null;
  }
  return (
    <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.goldSoft, paddingHorizontal: spacing.gutter, paddingVertical: spacing.sm }}>
      <Feather name="wifi-off" size={14} color={colors.text} />
      <View style={{ flex: 1 }}>
        <DAOText variant="bodySmall">{t('common.offline')}</DAOText>
        <DAOText variant="caption" tone="textMuted">{t('common.offlineHint')}</DAOText>
      </View>
    </View>
  );
}
