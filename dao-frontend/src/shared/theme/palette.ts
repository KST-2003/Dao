/**
 * DAO brand palette — raw values. Components NEVER import this directly;
 * they read semantic colors from the active theme (see themes.ts / useTheme).
 */
export const palette = {
  daoSage: '#9EAD91',
  deepSage: '#66745E',
  ivory: '#FFF9F1',
  softCream: '#F4EBDD',
  pearl: '#F5EFE6',
  cocoa: '#5C493F',
  lilyRose: '#D9A5A5',
  dustyRose: '#C99598',
  champagneGold: '#C9A96E',
  midnight: '#171917',
  white: '#FFFFFF',
  // Midnight theme companions
  midnightSage: '#788A70',
  midnightGold: '#D4B477',
  midnightSurface: '#202320',
  midnightSurfaceMuted: '#2A2E2A',
} as const;

/**
 * Colors for content drawn ON TOP of photos/video (identical in both themes, because the
 * photo — not the theme — is the background). Components use these instead of literals.
 */
export const media = {
  text: '#FFF9F1',
  textMuted: 'rgba(255,249,241,0.85)',
  track: 'rgba(255,249,241,0.25)',
  chip: 'rgba(23,25,23,0.55)',
  scrim: 'rgba(23,25,23,0.62)',
  glass: 'rgba(255,255,255,0.9)',
  glassIcon: '#5C493F',
  gold: '#C9A96E',
  midnight: '#171917',
  pearl: '#F5EFE6',
} as const;

/** Membership card gradients: entry tiers in sage, premium tiers in DAO Midnight. */
export const gradients = {
  member: ['#8FA083', '#66745E'] as [string, string],
  premium: ['#171917', '#2E332C'] as [string, string],
  photoFade: ['transparent', 'rgba(23,25,23,0.62)'] as [string, string],
};

/** Onboarding slide tones (DAO Fashion · Life · Kitchen · Members). */
export const onboardingTones = {
  ivory: { bg: '#FFF9F1', fg: '#5C493F', circle: '#F4EBDD', accent: '#5C493F' },
  rose: { bg: '#FBF1EE', fg: '#5C493F', circle: '#F3DEDB', accent: '#C99598' },
  sage: { bg: '#F1F4EE', fg: '#5C493F', circle: '#E1E8DB', accent: '#66745E' },
  midnight: { bg: '#171917', fg: '#F5EFE6', circle: '#262A26', accent: '#D4B477' },
} as const;
