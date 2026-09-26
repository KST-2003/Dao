import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DAOButton, DAOChip, DAOHeader, DAOInput, DAOScreen, DAOText } from '@/shared/components';
import { useTheme } from '@/shared/theme';
import { usePhoneScreen } from '../hooks/usePhoneScreen';

export default function PhoneScreen() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const vm = usePhoneScreen();
  return (
    <DAOScreen header={<DAOHeader />}>
      <View style={{ gap: spacing.xl, marginTop: spacing.lg }}>
        <View style={{ gap: spacing.sm }}>
          <DAOText variant="title">{t('auth.phoneTitle')}</DAOText>
          <DAOText tone="textMuted">{t('auth.phoneHint')}</DAOText>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <DAOChip label={t('auth.countryTH')} selected={vm.country === 'TH'} onPress={() => vm.setCountry('TH')} />
          <DAOChip label={t('auth.countryMM')} selected={vm.country === 'MM'} onPress={() => vm.setCountry('MM')} />
        </View>
        <DAOInput
          icon="phone"
          value={vm.phone}
          onChangeText={vm.setPhone}
          placeholder={vm.country === 'TH' ? '081 234 5678' : '09 123 456 789'}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          autoFocus
          error={vm.error}
          returnKeyType="send"
          onSubmitEditing={vm.canSubmit ? vm.submit : undefined}
        />
        <DAOButton label={t('auth.sendCode')} size="lg" fullWidth onPress={vm.submit} loading={vm.loading} disabled={!vm.canSubmit} />
      </View>
    </DAOScreen>
  );
}
