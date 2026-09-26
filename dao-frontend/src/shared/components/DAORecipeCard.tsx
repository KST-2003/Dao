import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { RecipeCard } from '@/types/models';
import { useLocale } from '@/shared/hooks/useLocale';
import { ratios, useTheme, media } from '@/shared/theme';
import { DAOImage } from './DAOImage';
import { DAOText } from './DAOText';

export function DAORecipeCard({ recipe, width }: { recipe: RecipeCard; width?: number }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const { radius, spacing, colors } = useTheme();
  const subtitle = locale !== 'th' && recipe.title_th && recipe.title_th !== recipe.title ? recipe.title_th : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={recipe.title ?? ''}
      onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: String(recipe.id) } })}
      style={({ pressed }) => [{ width, opacity: pressed ? 0.94 : 1 }]}
    >
      <View style={{ borderRadius: radius.md, overflow: 'hidden' }}>
        <DAOImage uri={recipe.cover_image_url} ratio={ratios.recipe} />
        {recipe.has_video ? (
          <View style={{ position: 'absolute', right: spacing.sm, bottom: spacing.sm, width: 28, height: 28, borderRadius: 14, backgroundColor: media.glass, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="play" size={13} color={media.glassIcon} />
          </View>
        ) : null}
      </View>
      <View style={{ paddingTop: spacing.sm, gap: 1 }}>
        <DAOText variant="bodyMedium" numberOfLines={1}>{recipe.title}</DAOText>
        {subtitle ? <DAOText variant="caption" tone="textMuted" numberOfLines={1}>{subtitle}</DAOText> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <Feather name="clock" size={11} color={colors.textSubtle} />
          <DAOText variant="caption" tone="textSubtle">{t('kitchen.minutes', { count: recipe.total_minutes })}</DAOText>
          <DAOText variant="caption" tone="accent">{'•'.repeat(Math.max(1, recipe.spice_level))}</DAOText>
        </View>
      </View>
    </Pressable>
  );
}
