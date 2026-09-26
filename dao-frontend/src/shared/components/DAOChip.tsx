import { Pressable } from 'react-native';
import { useTheme } from '@/shared/theme';
import { DAOText } from './DAOText';

export function DAOChip({ label, selected, onPress, disabled }: { label: string; selected?: boolean; onPress?: () => void; disabled?: boolean }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 36, justifyContent: 'center', paddingHorizontal: spacing.lg, borderRadius: radius.pill,
        backgroundColor: selected ? colors.primary : colors.surfaceMuted,
        opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
      })}
    >
      <DAOText variant="bodySmall" style={{ color: selected ? colors.onPrimary : colors.text, textDecorationLine: disabled ? 'line-through' : 'none' }}>
        {label}
      </DAOText>
    </Pressable>
  );
}
