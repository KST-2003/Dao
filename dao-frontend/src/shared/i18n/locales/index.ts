import { en } from './en';
import { my } from './my';
import { th } from './th';

export const resources = {
  en: { translation: en },
  th: { translation: th },
  my: { translation: my },
} as const;

export type AppLocale = keyof typeof resources;
export const SUPPORTED_LOCALES: AppLocale[] = ['en', 'th', 'my'];

/** Always shown in their own script so people can find their language. */
export const LOCALE_NATIVE_NAMES: Record<AppLocale, string> = {
  en: 'English',
  th: 'ไทย',
  my: 'မြန်မာ',
};

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as string[]).includes(value);
}
