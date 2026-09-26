import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DAOButton, DAOHeader, DAOInput, DAOLoadingSkeleton, DAOLogo, DAOScreen, DAOText } from '@/shared/components';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { LineSignInButton } from '../components/LineSignInButton';
import { useLoginScreen } from '../hooks/useLoginScreen';
import { useStyles } from './LoginScreen.styles';

export default function LoginScreen() {
  const { t } = useTranslation();
  const s = useStyles();
  const vm = useLoginScreen();

  return (
    <DAOScreen header={<DAOHeader back />}>
      <View style={s.hero}>
        <DAOLogo variant="mark" size={130} />
        <DAOText variant="title" align="center">{t('auth.welcomeTitle')}</DAOText>
        <DAOText tone="textMuted" align="center">{t('auth.welcomeSubtitle')}</DAOText>
      </View>
      <View style={s.buttons}>
        {vm.configLoading ? <DAOLoadingSkeleton height={54} radius={27} /> : null}
        {vm.methods.line ? <LineSignInButton onCode={vm.onLineCode} loading={vm.lineLoading} /> : null}
        {vm.methods.google ? <GoogleSignInButton onIdToken={vm.onGoogleToken} loading={vm.googleLoading} /> : null}
        {vm.methods.sms ? <DAOButton label={t('auth.continueWithSMS')} icon="smartphone" size="lg" fullWidth onPress={vm.goPhone} /> : null}
      </View>
      <View style={s.referral}>
        <Pressable accessibilityRole="button" onPress={vm.toggleReferral}>
          <DAOText variant="bodySmall" tone="primary" align="center">{t('auth.referralCode')}</DAOText>
        </Pressable>
        {vm.showReferral ? (
          <DAOInput value={vm.referralCode} onChangeText={vm.setReferralCode} autoCapitalize="characters" placeholder="DAOXXXXXX" maxLength={16} />
        ) : null}
      </View>
      <Pressable accessibilityRole="button" onPress={vm.browseAsGuest} style={s.guest}>
        <DAOText variant="bodyMedium" tone="textMuted">{t('auth.browseAsGuest')}</DAOText>
      </Pressable>
      <DAOText variant="caption" tone="textSubtle" align="center" style={s.terms}>{t('auth.terms')}</DAOText>
    </DAOScreen>
  );
}
