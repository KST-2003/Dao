import { View } from 'react-native';
import { useTheme } from '@/shared/theme';
import { DAOButton } from './DAOButton';
import { DAOLilyMark } from './DAOLilyMark';
import { DAOText } from './DAOText';

export function DAOEmptyState({ title, message, actionLabel, onAction }: { title: string; message?: string; actionLabel?: string; onAction?: () => void }) {
  const { spacing } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.huge, paddingHorizontal: spacing.xxl, gap: spacing.md }}>
      <DAOLilyMark size={56} opacity={0.6} />
      <DAOText variant="heading" align="center">{title}</DAOText>
      {message ? <DAOText tone="textMuted" align="center">{message}</DAOText> : null}
      {actionLabel && onAction ? <DAOButton label={actionLabel} onPress={onAction} style={{ marginTop: spacing.sm }} /> : null}
    </View>
  );
}
