import { usePathname } from 'expo-router';
import * as ScreenCapture from 'expo-screen-capture';
import { useEffect } from 'react';
import { useMe } from '@/features/auth/api';
import { i18n } from '@/shared/i18n';
import { analytics } from '@/shared/services/analytics/AnalyticsService';
import { toast } from '@/shared/store/toastStore';

const KEY = 'dao-content';

function isContentRoute(pathname: string): boolean {
  return pathname === '/vlog' || pathname === '/kitchen' || pathname.startsWith('/video/') || pathname.startsWith('/recipe/');
}

/**
 * Single app-wide screenshot/recording guard, driven by the focused route rather than by
 * component mount/unmount. Call this exactly once, from the root layout.
 *
 * Why not one `useContentProtection()` call per content screen (video, vlog, kitchen,
 * recipe), each with its own key? expo-screen-capture's `key` isn't a per-screen protected
 * region — it's a single global lock, reference-counted by a Set of keys, wrapping the whole
 * app's window once natively. Tab screens stay mounted in the background in this app, so
 * visiting a second content screen while the first was still mounted called the native
 * "wrap the window in a secure layer" routine a second time, nesting it — that corrupted the
 * window hierarchy and rendered the whole app black. Driving a single effect off the current
 * pathname avoids ever calling prevent/allow from more than one place.
 */
export function useContentProtection(): void {
  const pathname = usePathname();
  const me = useMe();
  const canScreenshot = me.data?.permissions?.can_screenshot ?? false;
  const shouldProtect = isContentRoute(pathname) && !canScreenshot;

  useEffect(() => {
    if (!shouldProtect) {
      return undefined;
    }
    void ScreenCapture.preventScreenCaptureAsync(KEY);
    const sub = ScreenCapture.addScreenshotListener(() => {
      analytics.track('screenshot_taken');
      toast.error(i18n.t('common.screenshotDetected'));
    });
    return () => {
      sub.remove();
      void ScreenCapture.allowScreenCaptureAsync(KEY);
    };
  }, [shouldProtect]);
}
