import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import { useTheme } from '@/shared/theme';
import { DAOButton } from './DAOButton';
import { DAOText } from './DAOText';

export function DAOErrorState({ error, onRetry }: { error?: unknown; onRetry?: () => void }) {
  const { t } = useTranslation();
  const message = useErrorMessage();
  const { colors, spacing } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.huge, paddingHorizontal: spacing.xxl, gap: spacing.md }} accessibilityLiveRegion="polite">
      <Feather name="cloud-off" size={32} color={colors.textSubtle} />
      <DAOText variant="heading" align="center">{t('common.somethingWentWrong')}</DAOText>
      <DAOText tone="textMuted" align="center">{message(error)}</DAOText>
      {onRetry ? <DAOButton label={t('common.tryAgain')} variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}
