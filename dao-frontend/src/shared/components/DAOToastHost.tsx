import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore } from '@/shared/store/toastStore';
import { useTheme } from '@/shared/theme';
import { DAOStar } from './DAOStar';
import { DAOText } from './DAOText';

/** Small confirmation toasts (e.g. "Added to your bag" with a View bag action). */
export function DAOToastHost() {
  const current = useToastStore((s) => s.current);
  const hide = useToastStore((s) => s.hide);
  const { colors, radius, spacing, shadows } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!current) {
      return;
    }
    const timer = setTimeout(hide, 3200);
    return () => clearTimeout(timer);
  }, [current, hide]);

  if (!current) {
    return null;
  }
  const bg = current.tone === 'error' ? colors.danger : colors.text;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 72, alignItems: 'center' }}>
      <Animated.View key={current.id} entering={FadeInDown.duration(220)} exiting={FadeOutDown.duration(180)} accessibilityLiveRegion="polite"
        style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: bg, borderRadius: radius.pill, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, maxWidth: '90%' }, shadows.floating]}>
        {current.tone === 'gold' || current.tone === 'success' ? <DAOStar size={12} /> : null}
        <DAOText variant="bodySmall" style={{ color: colors.background, flexShrink: 1 }}>{current.message}</DAOText>
        {current.action ? (
          <Pressable accessibilityRole="button" onPress={() => { current.action?.onPress(); hide(); }}>
            <DAOText variant="bodySmall" style={{ color: colors.gold, fontWeight: '600' }}>{current.action.label}</DAOText>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}
