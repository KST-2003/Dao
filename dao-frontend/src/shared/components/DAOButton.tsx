import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/shared/theme';
import { DAOText } from './DAOText';

type Variant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface DAOButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Feather.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

const HEIGHT: Record<Size, number> = { sm: 36, md: 48, lg: 54 };

export function DAOButton({ label, onPress, variant = 'primary', size = 'md', icon, loading, disabled, fullWidth, style, accessibilityHint }: DAOButtonProps) {
  const { colors, radius, spacing } = useTheme();
  const palette: Record<Variant, { bg: string; fg: string; border: string }> = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
    secondary: { bg: 'transparent', fg: colors.text, border: colors.border },
    ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
    gold: { bg: colors.gold, fg: colors.onGold, border: colors.gold },
    danger: { bg: 'transparent', fg: colors.danger, border: colors.danger },
  };
  const p = palette[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={() => {
        void Haptics.selectionAsync().catch(() => undefined);
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          height: HEIGHT[size],
          paddingHorizontal: size === 'sm' ? spacing.md : spacing.xl,
          borderRadius: radius.pill,
          backgroundColor: p.bg,
          borderColor: p.border,
          opacity: inactive ? 0.5 : pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        fullWidth && styles.full,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Feather name={icon} size={size === 'sm' ? 14 : 17} color={p.fg} style={{ marginRight: spacing.sm }} /> : null}
          <DAOText variant={size === 'sm' ? 'bodySmall' : 'button'} style={{ color: p.fg }} numberOfLines={1}>
            {label}
          </DAOText>
        </View>
      )}
    </Pressable>
  );
}

/** Outline variant — named for the component system (DAOSecondaryButton). */
export function DAOSecondaryButton(props: Omit<DAOButtonProps, 'variant'>) {
  return <DAOButton {...props} variant="secondary" />;
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth * 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  full: { alignSelf: 'stretch' },
});
