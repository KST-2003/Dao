import { usePrefsStore } from '@/shared/store/prefsStore';
import type { AppLocale } from '@/shared/i18n';

export function useLocale(): AppLocale {
  return usePrefsStore((s) => s.locale);
}
