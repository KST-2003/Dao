// EAS Build injects "expo-channel-name" from eas.json per profile, but a local
// `expo prebuild` + gradle build skips that, and the binary could never receive OTA
// updates. Declaring it here bakes it in for every build method. Defaults to "production".
const UPDATES_CHANNEL_BY_PROFILE = new Map([
  ['production', 'production'],
  ['production-apk', 'production'],
  ['preview', 'preview'],
  ['development', 'development'],
]);
const updatesChannel = UPDATES_CHANNEL_BY_PROFILE.get(process.env.EAS_BUILD_PROFILE ?? '') ?? 'production';

// Filled after `eas init` (see README). Placeholders keep the app buildable locally.
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID ?? '765a5e49-b1c4-4772-8abf-0efc85a17131';
const EAS_OWNER = process.env.EAS_OWNER ?? 'kaungsithu03-2';
const BUNDLE_ID = process.env.APP_BUNDLE_ID ?? 'com.daoapp.customer';

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: 'DAO',
    // Long form for stores: "DAO - Fashion & Lifestyle"
    description: 'DAO – Fashion & Lifestyle. A little world created by Dao.',
    slug: 'dao-frontend',
    owner: EAS_OWNER,
    scheme: 'dao',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/dao-logo.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    runtimeVersion: { policy: 'appVersion' },
    updates: EAS_PROJECT_ID
      ? {
          enabled: true,
          checkOnLaunch: 'ALWAYS',
          fallbackToCacheTimeout: 0,
          url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
          requestHeaders: { 'expo-channel-name': updatesChannel },
        }
      : { enabled: false },
    assetBundlePatterns: ['assets/**/*'],
    ios: {
      bundleIdentifier: BUNDLE_ID,
      buildNumber: '1',
      supportsTablet: false,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryUsageDescription: 'DAO uses your photos so you can add pictures to your reviews and profile.',
        NSCameraUsageDescription: 'DAO uses the camera so you can add photos to your reviews.',
      },
    },
    android: {
      package: BUNDLE_ID,
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/dao-logo.png',
        backgroundColor: '#FBF6EC',
      },
      edgeToEdgeEnabled: true,
    },
    web: { favicon: './assets/favicon.png', bundler: 'metro' },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-secure-store',
      'expo-localization',
      'expo-web-browser',
      'expo-video',
      ['expo-notifications', { color: '#66745E' }],
      [
        'expo-splash-screen',
        { image: './assets/dao-logo.png', imageWidth: 220, resizeMode: 'contain', backgroundColor: '#FBF6EC',
          dark: { image: './assets/dao-logo.png', backgroundColor: '#171917' } },
      ],
    ],
    experiments: { typedRoutes: true },
    extra: {
      eas: { projectId: EAS_PROJECT_ID || undefined },
    },
  },
};
