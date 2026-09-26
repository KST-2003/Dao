import { createContext, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { usePrefsStore } from '@/shared/store/prefsStore';
import { themes, type ThemeColors, type ThemeName } from './themes';
import { buildTypography, type TextVariant } from './typography';
import { radius, ratios, shadows, spacing, motion } from './tokens';
import type { TextStyle } from 'react-native';

export interface Theme {
  name: ThemeName;
  isDark: boolean;
  colors: ThemeColors;
  typography: Record<TextVariant, TextStyle>;
  spacing: typeof spacing;
  radius: typeof radius;
  ratios: typeof ratios;
  shadows: typeof shadows;
  motion: typeof motion;
}

export const ThemeContext = createContext<Theme | null>(null);

/** Resolves the active theme centrally: user preference → system appearance. */
export function ThemeProvider({ children, forced }: PropsWithChildren<{ forced?: ThemeName }>) {
  const scheme = useColorScheme();
  const mode = usePrefsStore((s) => s.themeMode);
  const locale = usePrefsStore((s) => s.locale);

  const name: ThemeName = forced ?? (mode === 'system' ? (scheme === 'dark' ? 'midnight' : 'botanical') : mode);

  const theme = useMemo<Theme>(
    () => ({
      name,
      isDark: name === 'midnight',
      colors: themes[name],
      typography: buildTypography(locale),
      spacing,
      radius,
      ratios,
      shadows,
      motion,
    }),
    [name, locale],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
