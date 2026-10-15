import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { detectDeviceLocale, type AppLocale } from '@/shared/i18n';
import type { Currency } from '@/types/enums';

export type ThemeMode = 'system' | 'botanical' | 'midnight';

interface PrefsState {
  hydrated: boolean;
  locale: AppLocale;
  hasChosenLanguage: boolean;
  hasOnboarded: boolean;
  themeMode: ThemeMode;
  /** Which currency prices are shown and paid in (sent to the API as X-Currency). */
  currency: Currency;
  recentSearches: string[];
  setLocale: (locale: AppLocale) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setCurrency: (currency: Currency) => void;
  completeOnboarding: () => void;
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
}

/** Per-device preferences (language, theme, onboarding). Persisted in AsyncStorage. */
export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      hydrated: false,
      locale: detectDeviceLocale(),
      hasChosenLanguage: false,
      hasOnboarded: false,
      themeMode: 'system',
      currency: 'THB',
      recentSearches: [],
      setLocale: (locale) => set({ locale, hasChosenLanguage: true }),
      setThemeMode: (themeMode) => set({ themeMode }),
      setCurrency: (currency) => set({ currency }),
      completeOnboarding: () => set({ hasOnboarded: true }),
      addRecentSearch: (q) =>
        set((s) => ({ recentSearches: [q, ...s.recentSearches.filter((x) => x !== q)].slice(0, 8) })),
      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'dao-prefs-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated: _h, ...rest }) => rest,
      onRehydrateStorage: () => () => usePrefsStore.setState({ hydrated: true }),
    },
  ),
);
