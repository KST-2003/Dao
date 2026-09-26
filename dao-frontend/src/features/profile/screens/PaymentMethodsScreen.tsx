import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppConfig } from '@/features/auth/api';
import { DAOCard, DAODivider, DAOHeader, DAOListItem, DAOScreen, DAOText } from '@/shared/components';
import { useTheme } from '@/shared/theme';

/** V1: no stored cards (Stripe Checkout handles card entry). Shows which methods are available at checkout. */
export default function PaymentMethodsScreen() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const config = useAppConfig();
  const methods = config.data?.payment_methods ?? [];
  return (
    <DAOScreen header={<DAOHeader title={t('profile.menu.paymentMethods')} />}>
      <View style={{ gap: spacing.lg }}>
        <DAOText tone="textMuted">{t('profile.paymentMethodsHint')}</DAOText>
        <DAOCard>
          {methods.length === 0 ? <DAOText tone="textMuted">{t('checkout.noPaymentMethods')}</DAOText> : methods.map((m, i) => (
            <View key={m}>
              {i > 0 ? <DAODivider /> : null}
              <DAOListItem icon={m === 'cod' ? 'truck' : m === 'bank_transfer' ? 'home' : 'credit-card'} label={t(`checkout.paymentMethods.${m}`)} />
            </View>
          ))}
        </DAOCard>
      </View>
    </DAOScreen>
  );
}
