import { useContext, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { ThemeContext, type Theme } from './ThemeProvider';

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return theme;
}

/**
 * Theme-aware StyleSheet factory. Every styles file uses this, so no component
 * hardcodes colors and switching Botanical ⇄ Midnight restyles the whole app.
 */
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(factory: (theme: Theme) => T) {
  return function useStyles(): T {
    const theme = useTheme();
    return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
  };
}
