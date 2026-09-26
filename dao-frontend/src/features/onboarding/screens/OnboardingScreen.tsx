import { FlatList, Pressable, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { DAOButton, DAOLilyMark, DAOLogo, DAOStar, DAOText } from '@/shared/components';
import { onboardingTones, useTheme } from '@/shared/theme';
import { useOnboardingScreen } from '../hooks/useOnboardingScreen';
import { useStyles } from './OnboardingScreen.styles';

const TONES = onboardingTones;

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const s = useStyles();
  const vm = useOnboardingScreen(width);
  const tone = TONES[vm.slides[vm.index]?.tone ?? 'ivory'];

  return (
    <View style={[s.root, { backgroundColor: tone.bg, paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <Pressable accessibilityRole="button" onPress={vm.skip} style={[s.skip, { top: insets.top + 12 }]} hitSlop={12}>
        <DAOText variant="bodySmall" style={{ color: tone.fg }}>{t('onboarding.skip')}</DAOText>
      </Pressable>
      <FlatList
        ref={vm.listRef}
        data={vm.slides}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={vm.onScrollEnd}
        renderItem={({ item }) => {
          const c = TONES[item.tone];
          return (
            <View style={[s.slide, { width }]}>
              <View style={[s.circle, { backgroundColor: c.circle }]}>
                {item.key === 'fashion' ? <DAOLogo variant="mark" size={120} /> : null}
                {item.key === 'life' ? <DAOLilyMark size={110} color={c.accent} /> : null}
                {item.key === 'kitchen' ? <DAOLilyMark size={110} color={c.accent} /> : null}
                {item.key === 'members' ? <DAOStar size={96} color={c.accent} twinkle /> : null}
              </View>
              <DAOText variant="display" align="center" style={{ color: c.fg }}>{item.title}</DAOText>
              <DAOText align="center" style={{ color: c.fg, opacity: 0.8 }}>{item.body}</DAOText>
            </View>
          );
        }}
      />
      <View style={s.footer}>
        <View style={s.dots}>
          {vm.slides.map((slide, i) => (
            <View key={slide.key} style={[s.dot, i === vm.index && s.dotActive, { backgroundColor: i === vm.index ? colors.gold : tone.fg, opacity: i === vm.index ? 1 : 0.25 }]} />
          ))}
        </View>
        <DAOButton label={vm.isLast ? t('onboarding.getStarted') : t('onboarding.next')} onPress={vm.next} size="lg" fullWidth variant={vm.slides[vm.index]?.tone === 'midnight' ? 'gold' : 'primary'} />
        <DAOText variant="caption" italic style={{ color: tone.fg, opacity: 0.6 }}>{t('brand.littleWorld')}</DAOText>
      </View>
    </View>
  );
}
