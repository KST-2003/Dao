import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AsyncState, DAOIconButton, DAOText } from '@/shared/components';
import { useTheme } from '@/shared/theme';
import { CookAlong } from '../components/CookAlong';
import { useRecipeVideoScreen } from '../hooks/useRecipeVideoScreen';

export default function RecipeVideoScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const vm = useRecipeVideoScreen();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />
      <AsyncState query={vm.recipe}>
        {(r) => r.video_url
          ? <CookAlong recipe={r} uri={r.video_url} startAt={vm.startAt} topInset={insets.top} />
          : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.gutter }}><DAOText tone="textMuted">{t('vlog.videoProcessing')}</DAOText></View>}
      </AsyncState>
      <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 8, left: spacing.gutter }}>
        <DAOIconButton icon="chevron-left" tone="glass" accessibilityLabel={t('common.back')} onPress={() => router.back()} />
      </View>
    </View>
  );
}
