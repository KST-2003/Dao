/**
 * Provider-independent analytics. Business logic calls `analytics.track(...)` only;
 * the concrete provider (Firebase, Amplitude, PostHog…) is plugged in at app start.
 */
export type AnalyticsEvent =
  | 'app_open'
  | 'signup'
  | 'login'
  | 'product_view'
  | 'product_search'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'checkout_started'
  | 'purchase_completed'
  | 'video_view'
  | 'video_completed'
  | 'video_like'
  | 'recipe_view'
  | 'wishlist_add'
  | 'coupon_used'
  | 'points_earned'
  | 'points_redeemed'
  | 'membership_upgrade'
  | 'screenshot_taken'
  | 'video_download';

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

export interface AnalyticsProvider {
  track(event: AnalyticsEvent, props?: AnalyticsProps): void;
  identify(userId: string, traits?: AnalyticsProps): void;
  reset(): void;
}

/** Development provider: logs to the Metro console. */
export class ConsoleAnalyticsProvider implements AnalyticsProvider {
  track(event: AnalyticsEvent, props?: AnalyticsProps): void {
    console.log('[analytics]', event, props ?? {});
  }
  identify(userId: string): void {
    console.log('[analytics] identify', userId);
  }
  reset(): void {
    console.log('[analytics] reset');
  }
}

/** Default in production until a real provider is configured — sends nothing. */
export class NoopAnalyticsProvider implements AnalyticsProvider {
  track(): void {}
  identify(): void {}
  reset(): void {}
}

let provider: AnalyticsProvider = __DEV__ ? new ConsoleAnalyticsProvider() : new NoopAnalyticsProvider();

export const analytics = {
  setProvider(next: AnalyticsProvider): void {
    provider = next;
  },
  track(event: AnalyticsEvent, props?: AnalyticsProps): void {
    try {
      provider.track(event, props);
    } catch {
      // analytics must never break the app
    }
  },
  identify(userId: string | number, traits?: AnalyticsProps): void {
    try {
      provider.identify(String(userId), traits);
    } catch {
      // ignore
    }
  },
  reset(): void {
    try {
      provider.reset();
    } catch {
      // ignore
    }
  },
};
