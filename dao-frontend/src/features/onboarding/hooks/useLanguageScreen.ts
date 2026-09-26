import { router } from 'expo-router';
import { useUpdateProfile } from '@/features/auth/api';
import { i18n, SUPPORTED_LOCALES, type AppLocale } from '@/shared/i18n';
import { useAuthStore } from '@/shared/store/authStore';
import { usePrefsStore } from '@/shared/store/prefsStore';

export function useLanguageScreen() {
  const locale = usePrefsStore((s) => s.locale);
  const setLocale = usePrefsStore((s) => s.setLocale);
  const hasOnboarded = usePrefsStore((s) => s.hasOnboarded);
  const signedIn = useAuthStore((s) => s.status) === 'authenticated';
  const updateProfile = useUpdateProfile();

  const select = (next: AppLocale) => {
    setLocale(next);
    void i18n.changeLanguage(next);
  };

  const confirm = () => {
    setLocale(locale); // marks the language as chosen
    if (signedIn) {
      updateProfile.mutate({ preferred_language: locale });
    }
    if (!hasOnboarded) {
      router.replace('/onboarding');
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return { locales: SUPPORTED_LOCALES, locale, select, confirm, isFirstRun: !hasOnboarded };
}
