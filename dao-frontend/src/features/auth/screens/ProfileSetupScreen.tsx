import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DAOButton, DAOHeader, DAOInput, DAOScreen, DAOStar, DAOText } from '@/shared/components';
import { useTheme } from '@/shared/theme';
import { useProfileSetupScreen } from '../hooks/useProfileSetupScreen';

export default function ProfileSetupScreen() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const vm = useProfileSetupScreen();
  return (
    <DAOScreen header={<DAOHeader back={false} />}>
      <View style={{ gap: spacing.xl }}>
        <View style={{ alignItems: 'center', gap: spacing.md, marginTop: spacing.lg }}>
          <DAOStar size={40} twinkle />
          <DAOText variant="title" align="center">{t('auth.profileSetupTitle')}</DAOText>
          <DAOText tone="textMuted" align="center">{t('auth.profileSetupSubtitle')}</DAOText>
        </View>
        <DAOInput label={t('auth.displayName')} value={vm.name} onChangeText={vm.setName} autoCapitalize="words" textContentType="nickname" maxLength={60} />
        <DAOInput
          label={`${t('auth.birthday')} · ${t('common.optional')}`}
          value={vm.birthday}
          onChangeText={vm.setBirthday}
          placeholder="1998-09-12"
          keyboardType="numbers-and-punctuation"
          hint={t('auth.birthdayHint')}
          error={vm.birthdayInvalid ? t('auth.birthdayHint') : vm.error}
          maxLength={10}
        />
        <DAOButton label={t('common.save')} size="lg" fullWidth onPress={vm.save} loading={vm.saving} disabled={vm.birthdayInvalid} />
        <DAOButton label={t('auth.skipForNow')} variant="ghost" fullWidth onPress={vm.skip} />
      </View>
    </DAOScreen>
  );
}
