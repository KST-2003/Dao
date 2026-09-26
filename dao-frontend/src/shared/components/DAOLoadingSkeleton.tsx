import { useEffect } from 'react';
import { View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { ratios, useTheme } from '@/shared/theme';

export function DAOLoadingSkeleton({ width = '100%', height = 16, radius, style }: { width?: DimensionValue; height?: DimensionValue; radius?: number; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  const opacity = useSharedValue(0.55);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      accessibilityLabel="loading"
      style={[{ width, height, borderRadius: radius ?? theme.radius.sm, backgroundColor: theme.colors.skeleton }, animated, style]}
    />
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  const { spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.gutter, gap: spacing.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width: '47.5%', gap: spacing.sm, marginBottom: spacing.lg }}>
          <DAOLoadingSkeleton height={undefined} style={{ aspectRatio: ratios.product }} radius={14} />
          <DAOLoadingSkeleton width="70%" height={12} />
          <DAOLoadingSkeleton width="40%" height={12} />
        </View>
      ))}
    </View>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  const { spacing } = useTheme();
  return (
    <View style={{ paddingHorizontal: spacing.gutter, gap: spacing.lg, paddingTop: spacing.lg }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
          <DAOLoadingSkeleton width={64} height={64} radius={12} />
          <View style={{ flex: 1, gap: spacing.sm }}>
            <DAOLoadingSkeleton width="60%" height={14} />
            <DAOLoadingSkeleton width="35%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}
