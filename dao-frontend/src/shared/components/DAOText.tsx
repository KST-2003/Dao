import { Text, type TextProps, type TextStyle } from 'react-native';
import { useTheme, type TextVariant, type ThemeColors } from '@/shared/theme';

export type TextTone = keyof Pick<
  ThemeColors,
  'text' | 'textMuted' | 'textSubtle' | 'textInverse' | 'primary' | 'onPrimary' | 'gold' | 'accent' | 'danger' | 'success' | 'onGold'
>;

export interface DAOTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  align?: TextStyle['textAlign'];
  italic?: boolean;
}

/** All text goes through here so fonts follow the active locale (Thai/Burmese scripts). */
export function DAOText({ variant = 'body', tone = 'text', align, italic, style, ...rest }: DAOTextProps) {
  const theme = useTheme();
  return (
    <Text
      maxFontSizeMultiplier={1.4}
      {...rest}
      style={[theme.typography[variant], { color: theme.colors[tone], textAlign: align }, italic && { fontStyle: 'italic' }, style]}
    />
  );
}
