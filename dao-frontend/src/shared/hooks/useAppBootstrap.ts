import {
  CormorantGaramond_400Regular, CormorantGaramond_500Medium_Italic, CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import {
  NotoSansMyanmar_400Regular, NotoSansMyanmar_500Medium, NotoSansMyanmar_600SemiBold, NotoSansMyanmar_700Bold,
} from '@expo-google-fonts/noto-sans-myanmar';
import {
  NotoSansThai_400Regular, NotoSansThai_500Medium, NotoSansThai_600SemiBold, NotoSansThai_700Bold,
} from '@expo-google-fonts/noto-sans-thai';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { onUnauthorized } from '@/shared/api/client';
import { queryClient } from '@/shared/api/queryClient';
import { i18n } from '@/shared/i18n';
import { analytics } from '@/shared/services/analytics/AnalyticsService';
import { useAuthStore } from '@/shared/store/authStore';
import { useCelebrationStore } from '@/shared/store/celebrationStore';
import { usePrefsStore } from '@/shared/store/prefsStore';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** Fonts + persisted prefs + session → ready. Also wires 401 handling and notification taps. */
export function useAppBootstrap(): boolean {
  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_400Regular, CormorantGaramond_500Medium_Italic, CormorantGaramond_600SemiBold,
    DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold,
    NotoSansThai_400Regular, NotoSansThai_500Medium, NotoSansThai_600SemiBold, NotoSansThai_700Bold,
    NotoSansMyanmar_400Regular, NotoSansMyanmar_500Medium, NotoSansMyanmar_600SemiBold, NotoSansMyanmar_700Bold,
  });
  const prefsHydrated = usePrefsStore((s) => s.hydrated);
  const locale = usePrefsStore((s) => s.locale);
  const authStatus = useAuthStore((s) => s.status);
  const ready = (fontsLoaded || !!fontError) && prefsHydrated && authStatus !== 'booting';

  useEffect(() => {
    void useAuthStore.getState().hydrate();
    onUnauthorized(() => {
      void useAuthStore.getState().signOut();
      queryClient.removeQueries({ queryKey: ['me'] });
      queryClient.removeQueries({ queryKey: ['cart'] });
    });
  }, []);

  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale]);

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync().catch(() => undefined);
      analytics.track('app_open');
    }
  }, [ready]);

  useEffect(() => {
    const open = (data: Record<string, unknown> | undefined) => {
      const route = typeof data?.route === 'string' ? data.route : null;
      if (route?.startsWith('/')) {
        router.push(route as never);
      }
    };
    const tap = Notifications.addNotificationResponseReceivedListener((r) => open(r.notification.request.content.data));
    const received = Notifications.addNotificationReceivedListener((n) => {
      const data = n.request.content.data as { celebrate?: string } | undefined;
      if (data?.celebrate === 'tier_upgrade') {
        useCelebrationStore.getState().celebrate({ kind: 'tier', tierName: n.request.content.body ?? '' });
      }
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['membership'] });
      void queryClient.invalidateQueries({ queryKey: ['points'] });
    });
    return () => {
      tap.remove();
      received.remove();
    };
  }, []);

  return ready;
}
