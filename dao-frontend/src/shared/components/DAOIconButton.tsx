import { Feather } from '@expo/vector-icons';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { hitSlop, useTheme, media } from '@/shared/theme';

export interface DAOIconButtonProps {
  icon: keyof typeof Feather.glyphMap;
  accessibilityLabel: string;
  onPress?: () => void;
  size?: number;
  tone?: 'surface' | 'glass' | 'plain' | 'primary';
  color?: string;
  badge?: number;
  style?: StyleProp<ViewStyle>;
}

export function DAOIconButton({ icon, accessibilityLabel, onPress, size = 40, tone = 'surface', color, style }: DAOIconButtonProps) {
  const { colors, shadows } = useTheme();
  const bg = { surface: colors.surface, glass: media.glass, plain: 'transparent', primary: colors.primary }[tone];
  const fg = color ?? (tone === 'primary' ? colors.onPrimary : tone === 'glass' ? media.glassIcon : colors.text);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlop}
      onPress={onPress}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: bg, opacity: pressed ? 0.75 : 1 },
        tone !== 'plain' && shadows.soft,
        style,
      ]}
    >
      <Feather name={icon} size={Math.round(size * 0.45)} color={fg} />
    </Pressable>
  );
}
