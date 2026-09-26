import { palette } from './palette';

export type ThemeName = 'botanical' | 'midnight';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceElevated: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  textInverse: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  gold: string;
  goldSoft: string;
  onGold: string;
  border: string;
  divider: string;
  success: string;
  warning: string;
  danger: string;
  dangerSoft: string;
  overlay: string;
  scrim: string;
  skeleton: string;
  skeletonHighlight: string;
  tabBar: string;
  tabActive: string;
  tabInactive: string;
  statusBar: 'dark' | 'light';
}

/** THEME A — DAO BOTANICAL (default): home, fashion, kitchen, community. */
const botanical: ThemeColors = {
  background: palette.ivory,
  surface: palette.white,
  surfaceMuted: palette.pearl,
  surfaceElevated: palette.white,
  text: palette.cocoa,
  textMuted: '#85746A',
  textSubtle: '#A99A8F',
  textInverse: palette.ivory,
  primary: palette.deepSage, // filled buttons: deep sage keeps white text at AA contrast
  primaryPressed: '#57644F',
  onPrimary: palette.white,
  primarySoft: '#E6ECE1',
  accent: palette.lilyRose,
  accentSoft: '#F6E6E4',
  gold: palette.champagneGold,
  goldSoft: '#F3EADB',
  onGold: palette.white,
  border: '#ECE3D5',
  divider: '#F1EADF',
  success: palette.deepSage,
  warning: '#B8894A',
  danger: '#B5555A',
  dangerSoft: '#F7E3E2',
  overlay: 'rgba(23,25,23,0.45)',
  scrim: 'rgba(23,25,23,0.28)',
  skeleton: '#F1E9DD',
  skeletonHighlight: '#F8F2E9',
  tabBar: palette.white,
  tabActive: palette.deepSage,
  tabInactive: '#B3A69B',
  statusBar: 'dark',
};

/** THEME B — DAO MIDNIGHT: dark mode, VIP, premium fashion, evening campaigns. */
const midnight: ThemeColors = {
  background: palette.midnight,
  surface: palette.midnightSurface,
  surfaceMuted: palette.midnightSurfaceMuted,
  surfaceElevated: '#262A26',
  text: palette.pearl,
  textMuted: '#BDB5AA',
  textSubtle: '#8E877E',
  textInverse: palette.midnight,
  primary: palette.midnightSage,
  primaryPressed: '#6A7B63',
  onPrimary: '#101210',
  primarySoft: '#2C352A',
  accent: palette.dustyRose,
  accentSoft: '#3A2C2D',
  gold: palette.midnightGold,
  goldSoft: '#3A3324',
  onGold: '#1B1A15',
  border: '#303530',
  divider: '#262A26',
  success: palette.midnightSage,
  warning: '#D1A465',
  danger: '#D9807F',
  dangerSoft: '#3B2626',
  overlay: 'rgba(0,0,0,0.6)',
  scrim: 'rgba(0,0,0,0.4)',
  skeleton: '#262A26',
  skeletonHighlight: '#2F342F',
  tabBar: '#1C1F1C',
  tabActive: palette.midnightGold,
  tabInactive: '#7B766E',
  statusBar: 'light',
};

export const themes: Record<ThemeName, ThemeColors> = { botanical, midnight };
