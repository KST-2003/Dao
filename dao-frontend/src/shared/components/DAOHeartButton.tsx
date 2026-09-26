import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { hitSlop, useTheme, media } from '@/shared/theme';

/** Favorite: the heart gently scales — no bounce. */
export function DAOHeartButton({ saved, onToggle, size = 34, label }: { saved: boolean; onToggle: () => void; size?: number; label: string }) {
  const { colors, motion, shadows } = useTheme();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: saved }}
      hitSlop={hitSlop}
      onPress={() => {
        scale.value = withSequence(withSpring(1.16, motion.spring), withSpring(1, motion.spring));
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        onToggle();
      }}
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: media.glass, alignItems: 'center', justifyContent: 'center' }, shadows.soft]}
    >
      <Animated.View style={style}>
        <Ionicons name={saved ? 'heart' : 'heart-outline'} size={size * 0.5} color={saved ? colors.accent : media.glassIcon} />
      </Animated.View>
    </Pressable>
  );
}
