import { usePrefsStore } from '@/shared/store/prefsStore';
import type { AppLocale } from '@/shared/i18n';

/**
 * Query hooks build their cache keys from this, so it also subscribes to the currency: changing currency re-renders
 * them, and the keys (which include the currency) point at the new prices.
 */
export function useLocale(): AppLocale {
  usePrefsStore((s) => s.currency);
  return usePrefsStore((s) => s.locale);
}
