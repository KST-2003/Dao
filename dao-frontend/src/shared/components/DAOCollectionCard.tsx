import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import type { Collection } from '@/types/models';
import { ratios, useTheme, media, gradients } from '@/shared/theme';
import { DAOImage } from './DAOImage';
import { DAOText } from './DAOText';

export function DAOCollectionCard({ collection, width, ratio = ratios.collection }: { collection: Collection; width?: number; ratio?: number }) {
  const { radius, spacing } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={collection.name ?? ''}
      onPress={() => router.push({ pathname: '/collection/[slug]', params: { slug: collection.slug } })}
      style={({ pressed }) => [{ width, borderRadius: radius.lg, overflow: 'hidden', opacity: pressed ? 0.94 : 1 }]}
    >
      <DAOImage uri={collection.hero_image_url} ratio={ratio} />
      <LinearGradient colors={gradients.photoFade} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' }} />
      <View style={{ position: 'absolute', left: spacing.lg, bottom: spacing.lg, right: spacing.lg }}>
        {collection.subtitle ? <DAOText variant="overline" style={{ color: media.textMuted }}>{collection.subtitle}</DAOText> : null}
        <DAOText variant="title" style={{ color: media.text }}>{collection.name}</DAOText>
      </View>
    </Pressable>
  );
}
