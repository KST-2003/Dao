import { View } from 'react-native';
import { useTheme } from '@/shared/theme';
import { DAOIconButton } from './DAOIconButton';
import { DAOText } from './DAOText';

export function DAOQuantityStepper({ value, min = 1, max, onChange, disabled }: { value: number; min?: number; max: number; onChange: (v: number) => void; disabled?: boolean }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 2 }} accessibilityRole="adjustable" accessibilityValue={{ min, max, now: value }}>
      <DAOIconButton icon="minus" tone="plain" size={32} accessibilityLabel="-" onPress={() => !disabled && value > min && onChange(value - 1)} color={value <= min ? colors.textSubtle : colors.text} />
      <DAOText variant="bodyMedium" style={{ minWidth: 22, textAlign: 'center', marginHorizontal: spacing.xs }}>{value}</DAOText>
      <DAOIconButton icon="plus" tone="plain" size={32} accessibilityLabel="+" onPress={() => !disabled && value < max && onChange(value + 1)} color={value >= max ? colors.textSubtle : colors.text} />
    </View>
  );
}
