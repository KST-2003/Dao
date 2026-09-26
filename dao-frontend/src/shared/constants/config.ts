import Constants from 'expo-constants';

const trim = (v?: string) => (v ?? '').trim();

export const API_URL = trim(process.env.EXPO_PUBLIC_API_URL).replace(/\/$/, '') || 'http://localhost:8000';
export const API_BASE = `${API_URL}/api/v1`;

export const TOKEN_KEY = 'dao_auth_token' as const;

export const GOOGLE_CLIENT_IDS = {
  ios: trim(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID),
  android: trim(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID),
  web: trim(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
};

export const LINE_CHANNEL_ID = trim(process.env.EXPO_PUBLIC_LINE_CHANNEL_ID);

/** Required by getExpoPushTokenAsync; comes from app.config.js (EAS_PROJECT_ID). */
export const EXPO_PROJECT_ID: string | undefined =
  (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId || undefined;

export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
