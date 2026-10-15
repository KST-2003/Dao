import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useTheme } from '@/shared/theme';

const SIZE = 96;

/** The big heart that pops where you double-tapped, then fades away. */
export function HeartBurst({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const tilt = useRef((Math.random() - 0.5) * 30).current;

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.15, friction: 4, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]),
      Animated.sequence([Animated.delay(450), Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true })]),
    ]).start(onDone);
  }, [scale, opacity, onDone]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', left: x - SIZE / 2, top: y - SIZE / 2, opacity, transform: [{ rotate: `${tilt}deg` }, { scale }] }}
    >
      <Ionicons name="heart" size={SIZE} color={colors.accent} />
    </Animated.View>
  );
}
