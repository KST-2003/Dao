import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/shared/theme';

interface DAOStarProps {
  size?: number;
  color?: string;
  /** Soft twinkle, used for celebrations and the membership card. */
  twinkle?: boolean;
}

/** The DAO four-point star (ดาว = star). */
export function DAOStar({ size = 16, color, twinkle }: DAOStarProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (twinkle) {
      scale.value = withRepeat(withSequence(withTiming(1.12, { duration: 900 }), withTiming(0.94, { duration: 900 })), -1, true);
    }
  }, [twinkle, scale]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animated} accessibilityElementsHidden importantForAccessibility="no">
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 0 C12.9 7.2 16.8 11.1 24 12 C16.8 12.9 12.9 16.8 12 24 C11.1 16.8 7.2 12.9 0 12 C7.2 11.1 11.1 7.2 12 0 Z" fill={color ?? colors.gold} />
      </Svg>
    </Animated.View>
  );
}
