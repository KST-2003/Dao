import type { AppLocale } from '@/shared/i18n';

const SYMBOLS: Record<string, string> = { THB: '฿', MMK: 'K ' };

/** Money arrives in minor units (satang). ฿590 / ฿1,160 / ฿12.50 */
export function formatMoney(minor: number | null | undefined, currency = 'THB'): string {
  const value = (minor ?? 0) / 100;
  const whole = Number.isInteger(value);
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${SYMBOLS[currency] ?? `${currency} `}${formatted}`;
}

const LOCALE_TAGS: Record<AppLocale, string> = { en: 'en-GB', th: 'th-TH', my: 'my-MM' };

export function formatDate(iso: string | null | undefined, locale: AppLocale, withTime = false): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  try {
    return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    }).format(date);
  } catch {
    return date.toDateString();
  }
}

/** 2400 → 2.4K */
export function formatCount(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(n);
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/** 482 → 8:02 */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
