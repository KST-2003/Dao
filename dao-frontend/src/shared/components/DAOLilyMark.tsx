import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/shared/theme';

/** A simple line lily (Lily = Dao's English name). Used for placeholders and empty states. */
export function DAOLilyMark({ size = 40, color, opacity = 1 }: { size?: number; color?: string; opacity?: number }) {
  const { colors } = useTheme();
  const stroke = color ?? colors.primary;
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" opacity={opacity} accessibilityElementsHidden importantForAccessibility="no">
      <Path d="M24 30 C19 24 18 15 24 6 C30 15 29 24 24 30 Z" stroke={stroke} strokeWidth={1.4} fill="none" strokeLinejoin="round" />
      <Path d="M24 30 C17 29 10 24 7 15 C15 15 21 20 24 30 Z" stroke={stroke} strokeWidth={1.4} fill="none" strokeLinejoin="round" />
      <Path d="M24 30 C31 29 38 24 41 15 C33 15 27 20 24 30 Z" stroke={stroke} strokeWidth={1.4} fill="none" strokeLinejoin="round" />
      <Path d="M24 30 C24 35 23 39 20 43" stroke={stroke} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      <Path d="M22.5 37 C18 35 15 36 13 39 C17 40 20 39 22.5 37 Z" stroke={stroke} strokeWidth={1.2} fill="none" />
    </Svg>
  );
}
