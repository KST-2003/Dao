import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DAOButton, DAOHeader, DAOScreen, DAOText } from '@/shared/components';
import { useOtpScreen } from '../hooks/useOtpScreen';
import { useStyles } from './OtpScreen.styles';

export default function OtpScreen() {
  const { t } = useTranslation();
  const s = useStyles();
  const vm = useOtpScreen();
  const digits = Array.from({ length: 6 }, (_, i) => vm.code[i] ?? '');

  return (
    <DAOScreen header={<DAOHeader />}>
      <View style={s.body}>
        <View>
          <DAOText variant="title">{t('auth.enterCode')}</DAOText>
          <DAOText tone="textMuted">{t('auth.codeSentTo', { phone: vm.phone })}</DAOText>
        </View>
        <View>
          <View style={s.boxes} importantForAccessibility="no-hide-descendants">
            {digits.map((d, i) => (
              <View key={i} style={[s.box, i === vm.code.length && s.boxActive]}>
                <DAOText variant="heading">{d}</DAOText>
              </View>
            ))}
          </View>
          <TextInput
            style={s.hiddenInput}
            value={vm.code}
            onChangeText={vm.onChange}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            maxLength={6}
            autoFocus
            accessibilityLabel={t('auth.enterCode')}
          />
        </View>
        {vm.error ? (
          <DAOText variant="bodySmall" tone="danger" accessibilityLiveRegion="polite">
            {vm.error}
            {vm.attemptsLeft != null ? ` · ${t('auth.attemptsLeft', { count: vm.attemptsLeft })}` : ''}
          </DAOText>
        ) : null}
        <DAOButton label={t('auth.verify')} size="lg" fullWidth onPress={vm.submit} loading={vm.verifying} disabled={vm.code.length !== 6} />
        <Pressable accessibilityRole="button" disabled={vm.cooldown > 0 || vm.resending} onPress={vm.resend}>
          <DAOText variant="bodySmall" tone={vm.cooldown > 0 ? 'textSubtle' : 'primary'} align="center">
            {vm.cooldown > 0 ? t('auth.resendIn', { seconds: String(vm.cooldown) }) : t('auth.resend')}
          </DAOText>
        </Pressable>
      </View>
    </DAOScreen>
  );
}
