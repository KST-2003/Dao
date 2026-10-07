import * as ScreenCapture from 'expo-screen-capture';
import { useEffect } from 'react';
import { useMe } from '@/features/auth/api';
import { i18n } from '@/shared/i18n';
import { analytics } from '@/shared/services/analytics/AnalyticsService';
import { toast } from '@/shared/store/toastStore';

/**
 * Screenshot/recording protection for one content screen (video, vlog feed, kitchen feed,
 * recipe). Skipped entirely for a user whose tier or per-user override grants
 * `can_screenshot` (ContentAccessService on the backend is the source of truth; this only
 * reads what `/me` already told us). `key` must be unique per screen — see
 * expo-screen-capture's `key` param — so two protected screens mounted at once (e.g. a tab
 * plus a detail screen pushed on top) don't release each other's lock on unmount.
 *
 * Android: FLAG_SECURE blocks the capture outright. iOS has no public API to block the
 * shutter action itself, so the capture succeeds but renders blank (the same secure-field
 * trick banking apps use) — we still hear about it via the listener so we can log it.
 */
export function useContentProtection(key: string): void {
  const me = useMe();
  const canScreenshot = me.data?.permissions?.can_screenshot ?? false;

  useEffect(() => {
    if (canScreenshot) {
      return undefined;
    }
    void ScreenCapture.preventScreenCaptureAsync(key);
    const sub = ScreenCapture.addScreenshotListener(() => {
      analytics.track('screenshot_taken');
      toast.error(i18n.t('common.screenshotDetected'));
    });
    return () => {
      sub.remove();
      void ScreenCapture.allowScreenCaptureAsync(key);
    };
  }, [canScreenshot, key]);
}
