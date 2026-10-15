import { Feather } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReelsUiStore } from '@/shared/store/reelsUiStore';
import { shadows, useTheme } from '@/shared/theme';
import { BLUR_AVAILABLE, DAOBlur } from './DAOBlur';
import { DAOText } from './DAOText';

export const TAB_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  index: 'home',
  shop: 'shopping-bag',
  vlog: 'play-circle',
  kitchen: 'coffee',
  me: 'user',
};

/** The tab whose video runs full-bleed underneath the floating bar. */
const OVERLAY_TAB = 'vlog';
/** How see-through the bar gets while a reel plays; it returns to solid when the video is paused. */
const FADED_OPACITY = 0.4;
/** Height of the sage pill itself (48 touch target + its vertical padding). */
const PILL_HEIGHT = 64;

/** How far content on the overlay tab must stay clear of the bottom edge to sit above the floating bar. */
export function useTabBarOverlayInset(): number {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, 12) + PILL_HEIGHT + 8;
}

/**
 * Quiet, editorial tab bar: a floating sage pill with cream icons and a champagne active tab. On the Vlog tab it
 * overlays the video (which runs edge to edge): the strip behind it is a frosted blur of that video and the pill turns
 * translucent, so the bar picks up the video's own colors. On other tabs it sits on the app background.
 */
export function DAOTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, spacing, typography, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const overlay = state.routes[state.index]?.name === OVERLAY_TAB;
  const bottom = Math.max(insets.bottom, spacing.md);
  const reelPlaying = useReelsUiStore((s) => s.playing);
  const fade = useRef(new Animated.Value(1)).current;
  const faded = overlay && reelPlaying;
  useEffect(() => {
    Animated.timing(fade, { toValue: faded ? FADED_OPACITY : 1, duration: 250, useNativeDriver: true }).start();
  }, [faded, fade]);

  return (
    <Animated.View
      style={[
        { opacity: fade },
        overlay
          ? { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: bottom }
          : { backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: bottom },
      ]}
    >
      {overlay ? <DAOBlur /> : null}
      <View
        style={[{ flexDirection: 'row', backgroundColor: overlay && BLUR_AVAILABLE ? colors.tabGlass : colors.tabBar, borderRadius: radius.xxl, paddingVertical: spacing.sm }, overlay && BLUR_AVAILABLE ? null : shadows.card]}
        accessibilityRole="tablist"
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const options = descriptors[route.key]?.options;
          const label = typeof options?.title === 'string' ? options.title : route.name;
          const color = focused ? colors.tabActive : colors.tabInactive;
          const isShop = route.name === 'shop';
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) {
                  void Haptics.selectionAsync().catch(() => undefined);
                  navigation.navigate(route.name);
                }
              }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 48 }}
            >
              <View style={isShop ? { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? colors.tabActiveSoft : 'transparent' } : undefined}>
                <Feather name={TAB_ICONS[route.name] ?? 'circle'} size={isShop ? 22 : 21} color={color} />
              </View>
              <DAOText style={[typography.caption, { color, fontSize: 11, marginTop: isShop ? 0 : 3, fontWeight: focused ? '700' : '500' }]} numberOfLines={1}>
                {label}
              </DAOText>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}
