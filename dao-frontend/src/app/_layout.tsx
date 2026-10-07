import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { persistOptions, queryClient } from '@/shared/api/queryClient';
import { DAOCelebration, DAOToastHost } from '@/shared/components';
import { useAppBootstrap } from '@/shared/hooks/useAppBootstrap';
import { useContentProtection } from '@/shared/hooks/useContentProtection';
import { initI18n } from '@/shared/i18n';
import { usePrefsStore } from '@/shared/store/prefsStore';
import { ThemeProvider, useTheme, media } from '@/shared/theme';

initI18n(usePrefsStore.getState().locale);

function ThemedStack() {
  const { colors } = useTheme();
  useContentProtection();
  return (
    <>
      <StatusBar style={colors.statusBar} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'fade_from_bottom' }}>
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(auth)" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="product/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="video/[id]" options={{ animation: 'fade', contentStyle: { backgroundColor: media.midnight } }} />
      </Stack>
      <DAOToastHost />
      <DAOCelebration />
    </>
  );
}

export default function RootLayout() {
  const ready = useAppBootstrap();
  if (!ready) {
    return null; // native splash stays visible
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
          <ThemeProvider>
            <ThemedStack />
          </ThemeProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
