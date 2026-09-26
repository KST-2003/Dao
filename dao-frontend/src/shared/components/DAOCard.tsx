import { Pressable, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '@/shared/theme';

interface DAOCardProps extends ViewProps {
  onPress?: () => void;
  padded?: boolean;
  muted?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function DAOCard({ onPress, padded = true, muted, style, children, accessibilityLabel, ...rest }: DAOCardProps) {
  const { colors, radius, spacing, shadows, isDark } = useTheme();
  const base: ViewStyle = {
    backgroundColor: muted ? colors.surfaceMuted : colors.surface,
    borderRadius: radius.lg,
    padding: padded ? spacing.lg : 0,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
    ...(muted ? {} : shadows.soft),
  };
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={({ pressed }) => [base, { opacity: pressed ? 0.92 : 1 }, style]} {...rest}>
        {children}
      </Pressable>
    );
  }
  return (
    <View style={[base, style]} {...rest}>
      {children}
    </View>
  );
}
