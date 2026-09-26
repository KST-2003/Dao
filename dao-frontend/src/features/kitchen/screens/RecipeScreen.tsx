import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AsyncState, DAOButton, DAOChip, DAOHeartButton, DAOIconButton, DAOImage, DAOScreen, DAOText } from '@/shared/components';
import { useLocale } from '@/shared/hooks/useLocale';
import { ratios, useTheme } from '@/shared/theme';
import { useRecipeScreen } from '../hooks/useRecipeScreen';

export default function RecipeScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const vm = useRecipeScreen();

  return (
    <DAOScreen padded={false}>
      <AsyncState query={vm.recipe}>
        {(r) => (
          <>
            <View>
              <DAOImage uri={r.cover_image_url} ratio={ratios.recipe} priority="high" />
              <View style={{ position: 'absolute', top: insets.top + 8, left: spacing.gutter, right: spacing.gutter, flexDirection: 'row', justifyContent: 'space-between' }}>
                <DAOIconButton icon="chevron-left" tone="glass" accessibilityLabel={t('common.back')} onPress={() => router.back()} />
                <DAOHeartButton saved={vm.saved} onToggle={vm.toggleSave} size={40} label={t('profile.menu.savedRecipes')} />
              </View>
            </View>
            <View style={{ marginTop: -spacing.xxl, backgroundColor: colors.background, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, padding: spacing.gutter, gap: spacing.lg }}>
              <View style={{ gap: 2 }}>
                <DAOText variant="title">{r.title}</DAOText>
                {locale !== 'th' && r.title_th ? <DAOText tone="textMuted">{r.title_th}</DAOText> : null}
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.lg, flexWrap: 'wrap' }}>
                <DAOText variant="bodySmall" tone="textMuted"><Feather name="clock" size={12} /> {t('kitchen.minutes', { count: r.total_minutes })}</DAOText>
                <DAOText variant="bodySmall" tone="textMuted"><Feather name="users" size={12} /> {t('kitchen.servings', { count: r.servings })}</DAOText>
                <DAOText variant="bodySmall" tone="textMuted">{t(`kitchen.difficulty.${r.difficulty}`)}</DAOText>
                <DAOText variant="bodySmall" tone="accent">{t(`kitchen.spice.${String(Math.min(3, r.spice_level)) as '0' | '1' | '2' | '3'}`)}</DAOText>
              </View>
              {r.description ? <DAOText tone="textMuted">{r.description}</DAOText> : null}
              {r.video ? <DAOButton label={t('kitchen.watchDaoCook')} icon="play" variant="secondary" fullWidth onPress={vm.watch} /> : null}

              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <DAOChip label={t('kitchen.ingredients')} selected={vm.tab === 'ingredients'} onPress={() => vm.setTab('ingredients')} />
                <DAOChip label={t('kitchen.steps')} selected={vm.tab === 'steps'} onPress={() => vm.setTab('steps')} />
              </View>

              {vm.tab === 'ingredients' ? (
                <View>
                  {r.ingredients.map((i) => (
                    <View key={i.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider, gap: spacing.md }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
                      <DAOText style={{ flex: 1 }}>{i.name}</DAOText>
                      <DAOText variant="bodySmall" tone="textMuted">{[i.quantity, i.unit].filter(Boolean).join(' ')}</DAOText>
                      {i.product_id ? <Pressable accessibilityRole="button" onPress={() => vm.shopIngredient(i.product_id!)}><DAOText variant="caption" tone="primary">{t('kitchen.shopIngredient')}</DAOText></Pressable> : null}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={{ gap: spacing.lg }}>
                  {r.steps.map((s) => (
                    <Pressable key={s.number} accessibilityRole="checkbox" accessibilityState={{ checked: vm.stepDone(s.number) }} onPress={() => vm.toggleStep(s.number)} style={{ flexDirection: 'row', gap: spacing.md, opacity: vm.stepDone(s.number) ? 0.5 : 1 }}>
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: vm.stepDone(s.number) ? colors.primary : colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                        {vm.stepDone(s.number) ? <Feather name="check" size={14} color={colors.onPrimary} /> : <DAOText variant="caption" tone="primary">{s.number}</DAOText>}
                      </View>
                      <View style={{ flex: 1, gap: spacing.sm }}>
                        <DAOText variant="overline" tone="textMuted">{t('kitchen.step', { number: String(s.number) })}</DAOText>
                        <DAOText>{s.instruction}</DAOText>
                        {s.image_url ? <DAOImage uri={s.image_url} ratio={ratios.recipe} style={{ borderRadius: radius.md }} /> : null}
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
              {r.tips ? (
                <View style={{ backgroundColor: colors.goldSoft, borderRadius: radius.lg, padding: spacing.lg, gap: 4 }}>
                  <DAOText variant="subheading">{t('kitchen.tips')}</DAOText>
                  <DAOText tone="textMuted">{r.tips}</DAOText>
                </View>
              ) : null}
            </View>
          </>
        )}
      </AsyncState>
    </DAOScreen>
  );
}
