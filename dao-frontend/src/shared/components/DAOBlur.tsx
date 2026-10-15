import { BlurView } from 'expo-blur';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { StyleSheet } from 'react-native';

/**
 * True only when this app binary actually contains expo-blur's native code. A build made before the package was
 * added (or an Expo Go without it) would otherwise render a red "Unimplemented component" box instead of a blur.
 */
export const BLUR_AVAILABLE = requireOptionalNativeModule('ExpoBlurView') != null;

/** Frosted-glass fill for its parent; renders nothing (callers keep a solid-enough fallback color) when blur isn't available. */
export function DAOBlur({ intensity = 70 }: { intensity?: number }) {
  if (!BLUR_AVAILABLE) return null;
  return <BlurView pointerEvents="none" intensity={intensity} tint="default" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />;
}
