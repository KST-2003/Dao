import { View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { DAOButton, DAOCard, DAOScreen, DAOStar, DAOText } from '@/shared/components';
import { formatMoney } from '@/shared/utils/format';
import { useTheme } from '@/shared/theme';
import { useOrderSuccessScreen } from '../hooks/useOrderSuccessScreen';

function Line({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <DAOText variant="bodySmall" tone="textMuted">{label}</DAOText>
      <DAOText variant="bodyMedium" selectable style={{ flexShrink: 1, textAlign: 'right' }}>{value}</DAOText>
    </View>
  );
}

export default function OrderSuccessScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { spacing } = useTheme();
  const vm = useOrderSuccessScreen();
  const o = vm.order.data;
  const bank = vm.payment?.action === 'bank_transfer' ? vm.payment.instructions : null;

  return (
    <DAOScreen header={<View style={{ height: insets.top + spacing.xxl }} />}>
      <View style={{ alignItems: 'center', gap: spacing.md, marginBottom: spacing.xxl }}>
        <Animated.View entering={ZoomIn.duration(500)}><DAOStar size={64} twinkle /></Animated.View>
        <DAOText variant="display" align="center">{t('orderSuccess.title')}</DAOText>
        <DAOText tone="textMuted" align="center">{t('orderSuccess.subtitle')}</DAOText>
        {o ? <DAOText variant="bodyMedium" selectable>{t('orderSuccess.orderNumber', { number: o.order_number })}</DAOText> : null}
      </View>
      {bank ? (
        <DAOCard style={{ gap: spacing.md, marginBottom: spacing.lg }}>
          <DAOText tone="textMuted">{t('orderSuccess.bankInstructions')}</DAOText>
          <Line label={t('orderSuccess.bankName')} value={bank.bank_name} />
          <Line label={t('orderSuccess.accountName')} value={bank.account_name} />
          <Line label={t('orderSuccess.accountNumber')} value={bank.account_number} />
          <Line label={t('orderSuccess.promptPay')} value={bank.promptpay_id} />
          <Line label={t('orderSuccess.amount')} value={formatMoney(bank.amount, bank.currency)} />
          <Line label={t('orderSuccess.reference')} value={bank.reference} />
        </DAOCard>
      ) : null}
      {vm.payment?.action === 'collect_on_delivery' && o ? (
        <DAOCard muted style={{ marginBottom: spacing.lg }}><DAOText align="center">{t('orderSuccess.cod', { amount: formatMoney(o.grand_total, o.currency) })}</DAOText></DAOCard>
      ) : null}
      <DAOText variant="caption" tone="gold" align="center" style={{ marginBottom: spacing.xl }}>{t('orderSuccess.pointsNote')}</DAOText>
      <View style={{ gap: spacing.md }}>
        {vm.needsPayment ? <DAOButton label={t('orderSuccess.payNow')} variant="gold" size="lg" fullWidth onPress={vm.completePayment} loading={vm.paying} /> : null}
        <DAOButton label={t('orderSuccess.viewOrder')} size="lg" fullWidth onPress={vm.viewOrder} />
        <DAOButton label={t('orderSuccess.continueShopping')} variant="ghost" fullWidth onPress={vm.continueShopping} />
      </View>
    </DAOScreen>
  );
}
