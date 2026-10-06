import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { motion, useTheme } from '@/shared/theme';
import { DAOIconButton } from './DAOIconButton';
import { DAOText } from './DAOText';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
}

/**
 * Modal's own `animationType="slide"` moves the whole modal — backdrop included — as one
 * unit, so the scrim visibly slides up from the bottom with the sheet instead of just being
 * there. `animationType="none"` turns that off; the backdrop and the sheet then animate
 * independently with Reanimated, each on its own timing.
 */
export function DAOBottomSheet({ visible, onClose, title, children }: PropsWithChildren<Props>) {
  const { colors, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <AnimatedPressable
        entering={FadeIn.duration(motion.fast)}
        exiting={FadeOut.duration(motion.fast)}
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
        onPress={onClose}
        accessibilityLabel="close"
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap} pointerEvents="box-none">
        <Animated.View
          entering={SlideInDown.duration(motion.base)}
          exiting={SlideOutDown.duration(motion.fast)}
          style={{ backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: spacing.gutter, paddingBottom: insets.bottom + spacing.lg, maxHeight: '88%' }}
        >
          <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginTop: spacing.sm, marginBottom: spacing.md }} />
          {title ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
              <DAOText variant="heading">{title}</DAOText>
              <DAOIconButton icon="x" tone="plain" accessibilityLabel="close" onPress={onClose} />
            </View>
          ) : null}
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({ wrap: { flex: 1, justifyContent: 'flex-end' } });
