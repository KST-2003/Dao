import { Feather } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/shared/theme';
import { DAOText } from './DAOText';

export function DAOListItem({ icon, label, value, onPress, right, danger }: { icon?: keyof typeof Feather.glyphMap; label: string; value?: string; onPress?: () => void; right?: ReactNode; danger?: boolean }) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} disabled={!onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: spacing.md, opacity: pressed ? 0.7 : 1 })}>
      {icon ? <Feather name={icon} size={18} color={danger ? colors.danger : colors.text} /> : null}
      <DAOText style={{ flex: 1 }} tone={danger ? 'danger' : 'text'}>{label}</DAOText>
      {value ? <DAOText variant="bodySmall" tone="textMuted">{value}</DAOText> : null}
      {right ?? (onPress ? <Feather name="chevron-right" size={18} color={colors.textSubtle} /> : null)}
    </Pressable>
  );
}

export function DAODivider() {
  const { colors } = useTheme();
  return <View style={{ height: 1, backgroundColor: colors.divider }} />;
}
