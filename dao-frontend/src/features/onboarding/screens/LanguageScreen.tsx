import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DAOButton, DAOHeader, DAOLogo, DAOScreen, DAOText } from '@/shared/components';
import { LOCALE_NATIVE_NAMES } from '@/shared/i18n';
import { useTheme } from '@/shared/theme';
import { useLanguageScreen } from '../hooks/useLanguageScreen';
import { useStyles } from './LanguageScreen.styles';

export default function LanguageScreen() {
  const { t } = useTranslation();
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const vm = useLanguageScreen();

  return (
    <DAOScreen scroll={false} header={vm.isFirstRun ? <View style={{ height: insets.top }} /> : <DAOHeader title={t('settings.language')} />}>
      <View style={s.body}>
        <View style={s.brand}>
          <DAOLogo variant="mark" size={110} />
          <DAOText variant="title" align="center">{t('language.title')}</DAOText>
          <DAOText tone="textMuted" align="center">{t('language.subtitle')}</DAOText>
        </View>
        <View style={s.options} accessibilityRole="radiogroup">
          {vm.locales.map((code) => {
            const selected = code === vm.locale;
            return (
              <Pressable key={code} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => vm.select(code)} style={[s.option, selected && s.optionSelected]}>
                <DAOText variant="subheading">{LOCALE_NATIVE_NAMES[code]}</DAOText>
                {selected ? <Feather name="check-circle" size={20} color={colors.primary} /> : <Feather name="circle" size={20} color={colors.border} />}
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={s.footer}>
        <DAOButton label={t('common.continue')} onPress={vm.confirm} size="lg" fullWidth />
      </View>
    </DAOScreen>
  );
}
