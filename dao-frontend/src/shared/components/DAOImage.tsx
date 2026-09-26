import { Image, type ImageStyle } from 'expo-image';
import { StyleSheet, View, type StyleProp } from 'react-native';
import { useTheme } from '@/shared/theme';
import { DAOLilyMark } from './DAOLilyMark';

interface DAOImageProps {
  uri: string | null | undefined;
  style?: StyleProp<ImageStyle>;
  ratio?: number;
  accessibilityLabel?: string;
  priority?: 'low' | 'normal' | 'high';
  contentFit?: 'cover' | 'contain';
}

/** Cached, lazily decoded image with a quiet brand placeholder (never a broken image icon). */
export function DAOImage({ uri, style, ratio, accessibilityLabel, priority = 'normal', contentFit = 'cover' }: DAOImageProps) {
  const { colors } = useTheme();
  const shape: ImageStyle = ratio ? { width: '100%', aspectRatio: ratio } : {};
  if (!uri) {
    return (
      <View style={[shape, styles.placeholder, { backgroundColor: colors.surfaceMuted }, style as object]} accessibilityLabel={accessibilityLabel}>
        <DAOLilyMark size={36} opacity={0.35} />
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={[shape, { backgroundColor: colors.surfaceMuted }, style]}
      contentFit={contentFit}
      transition={180}
      cachePolicy="memory-disk"
      priority={priority}
      recyclingKey={uri}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center' },
});
