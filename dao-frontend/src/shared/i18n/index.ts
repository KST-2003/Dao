import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { en } from './locales/en';
import { isAppLocale, resources, type AppLocale } from './locales';

export { LOCALE_NATIVE_NAMES, SUPPORTED_LOCALES, isAppLocale, type AppLocale } from './locales';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof en };
  }
}

/** Device locale → supported app locale (Burmese devices report "my"). */
export function detectDeviceLocale(): AppLocale {
  for (const l of getLocales()) {
    const code = l.languageCode?.toLowerCase();
    if (isAppLocale(code)) {
      return code;
    }
  }
  return 'en';
}

export function initI18n(locale: AppLocale): typeof i18n {
  if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
      resources,
      lng: locale,
      fallbackLng: 'en', // controlled fallback: never show a raw key
      returnNull: false,
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
      parseMissingKeyHandler: () => '',
    });
  } else if (i18n.language !== locale) {
    void i18n.changeLanguage(locale);
  }
  return i18n;
}

export { i18n };
