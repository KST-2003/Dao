import { Share, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useReferral } from '@/features/loyalty/api';
import { AsyncState, DAOButton, DAOCard, DAOHeader, DAOScreen, DAOStar, DAOText } from '@/shared/components';
import { formatNumber } from '@/shared/utils/format';
import { useTheme } from '@/shared/theme';

export default function ReferralScreen() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const referral = useReferral();
  return (
    <DAOScreen header={<DAOHeader title={t('profile.menu.referral')} />}>
      <AsyncState query={referral}>
        {(r) => (
          <View style={{ gap: spacing.xl, alignItems: 'center', marginTop: spacing.xl }}>
            <DAOStar size={48} twinkle />
            <DAOText variant="title" align="center">{t('profile.referralTitle')}</DAOText>
            <DAOText tone="textMuted" align="center">{t('profile.referralBody', { referrer: formatNumber(r.referrer_bonus), referee: formatNumber(r.referee_bonus) })}</DAOText>
            <DAOCard style={{ alignSelf: 'stretch', alignItems: 'center' }}>
              <DAOText variant="display" selectable>{r.code}</DAOText>
            </DAOCard>
            <DAOButton label={t('profile.shareCode')} icon="share" size="lg" fullWidth onPress={() => void Share.share({ message: `DAO ✦ ${r.code}` })} />
          </View>
        )}
      </AsyncState>
    </DAOScreen>
  );
}
