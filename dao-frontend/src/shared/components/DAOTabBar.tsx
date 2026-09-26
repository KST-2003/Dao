import { Feather } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/theme';
import { DAOText } from './DAOText';

export const TAB_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  index: 'home',
  shop: 'shopping-bag',
  vlog: 'play-circle',
  kitchen: 'coffee',
  me: 'user',
};

/** Quiet, editorial tab bar. Shop is the visual center of gravity (centered, slightly emphasized). */
export function DAOTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, spacing, typography } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{ flexDirection: 'row', backgroundColor: colors.tabBar, borderTopWidth: 1, borderTopColor: colors.divider, paddingBottom: Math.max(insets.bottom, spacing.sm), paddingTop: spacing.sm }}
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
            <View style={isShop ? { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? colors.primarySoft : 'transparent' } : undefined}>
              <Feather name={TAB_ICONS[route.name] ?? 'circle'} size={isShop ? 22 : 21} color={color} />
            </View>
            <DAOText style={[typography.caption, { color, fontSize: 11, marginTop: isShop ? 0 : 3 }]} numberOfLines={1}>
              {label}
            </DAOText>
          </Pressable>
        );
      })}
    </View>
  );
}
