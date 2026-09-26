import type { TextStyle } from 'react-native';
import type { AppLocale } from '@/shared/i18n/locales';

/**
 * Font families. The DAO wordmark/editorial display face is Cormorant Garamond.
 * Latin UI text uses DM Sans. Thai and Burmese use Noto Sans scripts, since the
 * Latin faces have no Thai/Myanmar glyphs. Burmese needs extra line height.
 */
export const fontAssets = {
  brand: 'CormorantGaramond_600SemiBold',
  brandItalic: 'CormorantGaramond_500Medium_Italic',
  brandLight: 'CormorantGaramond_400Regular',
} as const;

interface LocaleFonts {
  display: string;
  displayItalic: string;
  regular: string;
  medium: string;
  semibold: string;
  bold: string;
  lineHeightScale: number;
}

const latin: LocaleFonts = {
  display: 'CormorantGaramond_600SemiBold',
  displayItalic: 'CormorantGaramond_500Medium_Italic',
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
  lineHeightScale: 1,
};

export const localeFonts: Record<AppLocale, LocaleFonts> = {
  en: latin,
  th: {
    display: 'NotoSansThai_600SemiBold',
    displayItalic: 'NotoSansThai_500Medium',
    regular: 'NotoSansThai_400Regular',
    medium: 'NotoSansThai_500Medium',
    semibold: 'NotoSansThai_600SemiBold',
    bold: 'NotoSansThai_700Bold',
    lineHeightScale: 1.12,
  },
  my: {
    display: 'NotoSansMyanmar_600SemiBold',
    displayItalic: 'NotoSansMyanmar_500Medium',
    regular: 'NotoSansMyanmar_400Regular',
    medium: 'NotoSansMyanmar_500Medium',
    semibold: 'NotoSansMyanmar_600SemiBold',
    bold: 'NotoSansMyanmar_700Bold',
    lineHeightScale: 1.4,
  },
};

export type TextVariant =
  | 'brand'
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyMedium'
  | 'bodySmall'
  | 'caption'
  | 'overline'
  | 'price'
  | 'button';

type Spec = { size: number; line: number; font: keyof Omit<LocaleFonts, 'lineHeightScale'> | 'brand'; letter?: number; upper?: boolean };

const specs: Record<TextVariant, Spec> = {
  brand: { size: 30, line: 34, font: 'brand', letter: 1 },
  display: { size: 34, line: 40, font: 'display' },
  title: { size: 26, line: 32, font: 'display' },
  heading: { size: 21, line: 27, font: 'display' },
  subheading: { size: 16, line: 22, font: 'semibold' },
  body: { size: 15, line: 22, font: 'regular' },
  bodyMedium: { size: 15, line: 22, font: 'medium' },
  bodySmall: { size: 13, line: 19, font: 'regular' },
  caption: { size: 12, line: 16, font: 'regular' },
  overline: { size: 11, line: 14, font: 'semibold', letter: 1.6, upper: true },
  price: { size: 16, line: 22, font: 'semibold' },
  button: { size: 15, line: 20, font: 'semibold', letter: 0.2 },
};

export function buildTypography(locale: AppLocale): Record<TextVariant, TextStyle> {
  const fonts = localeFonts[locale];
  const out = {} as Record<TextVariant, TextStyle>;
  (Object.keys(specs) as TextVariant[]).forEach((variant) => {
    const s = specs[variant];
    const scale = s.font === 'brand' ? 1 : fonts.lineHeightScale;
    out[variant] = {
      fontFamily: s.font === 'brand' ? fontAssets.brand : fonts[s.font],
      fontSize: s.size,
      lineHeight: Math.round(s.line * scale),
      letterSpacing: locale === 'en' || s.font === 'brand' ? s.letter : 0,
      textTransform: s.upper && locale === 'en' ? 'uppercase' : 'none',
    };
  });
  return out;
}
