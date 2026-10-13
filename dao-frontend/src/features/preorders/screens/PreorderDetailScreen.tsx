import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AsyncState, DAOButton, DAOCard, DAOChip, DAOHeader, DAOImage, DAOModal, DAOScreen, DAOText } from '@/shared/components';
import { useLocale } from '@/shared/hooks/useLocale';
import { formatDate, formatMoney } from '@/shared/utils/format';
import { useTheme } from '@/shared/theme';
import { PreorderStatusBadge } from '../components/PreorderStatusBadge';
import { usePreorderDetailScreen } from '../hooks/usePreorderDetailScreen';

function Line({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <DAOText variant="bodySmall" tone="textMuted">{label}</DAOText>
      <DAOText variant="bodyMedium" selectable style={{ flexShrink: 1, textAlign: 'right' }}>{value}</DAOText>
    </View>
  );
}

export default function PreorderDetailScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { spacing, colors, radius } = useTheme();
  const vm = usePreorderDetailScreen();

  return (
    <DAOScreen header={<DAOHeader title={vm.preorder.data?.preorder_number ?? t('preorders.title')} />} refreshing={vm.preorder.isRefetching} onRefresh={() => void vm.preorder.refetch()}>
      <AsyncState query={vm.preorder}>
        {(p) => {
          const reached = p.steps.indexOf(p.status);
          const closed = p.status === 'rejected' || p.status === 'cancelled' || p.status === 'refunded';
          return (
            <View style={{ gap: spacing.lg }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <DAOText variant="caption" tone="textMuted">{t('preorders.submittedOn', { date: formatDate(p.submitted_at, locale, true) })} · {t(`preorders.destination.${p.destination}`)}</DAOText>
                <PreorderStatusBadge status={p.status} />
              </View>

              {p.status === 'rejected' && p.reject_reason ? (
                <DAOCard muted style={{ gap: 4 }}>
                  <DAOText variant="subheading">{t('preorders.rejectedTitle')}</DAOText>
                  <DAOText variant="bodySmall" tone="textMuted">{p.reject_reason}</DAOText>
                </DAOCard>
              ) : null}

              <DAOCard style={{ gap: spacing.md }}>
                <DAOText variant="subheading">{t('preorders.progress')}</DAOText>
                {p.steps.map((step, i) => {
                  const done = !closed && i <= reached;
                  const at = p.timeline?.find((x) => x.status === step)?.at;
                  return (
                    <View key={step} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                      <Feather name={done ? 'check-circle' : 'circle'} size={18} color={done ? colors.primary : colors.border} />
                      <DAOText variant="bodySmall" tone={done ? 'text' : 'textSubtle'} style={{ flex: 1 }}>{t(`preorders.status.${step}`)}</DAOText>
                      {at ? <DAOText variant="caption" tone="textSubtle">{formatDate(at, locale, true)}</DAOText> : null}
                    </View>
                  );
                })}
              </DAOCard>

              {p.tracking_number ? (
                <DAOCard style={{ gap: spacing.sm }}>
                  <DAOText variant="subheading">{t('orders.tracking')}</DAOText>
                  <DAOText selectable>{[p.carrier, p.tracking_number].filter(Boolean).join(' · ')}</DAOText>
                </DAOCard>
              ) : null}

              <DAOCard style={{ gap: spacing.md }}>
                {(p.items ?? []).map((i) => (
                  <View key={i.id} style={{ flexDirection: 'row', gap: spacing.md }}>
                    <View style={{ width: 56, borderRadius: radius.sm, overflow: 'hidden' }}><DAOImage uri={i.image_url} ratio={3 / 4} /></View>
                    <View style={{ flex: 1 }}>
                      <DAOText variant="bodyMedium">{i.name}</DAOText>
                      {i.variant_label ? <DAOText variant="caption" tone="textMuted">{i.variant_label}</DAOText> : null}
                      <DAOText variant="caption" tone="textMuted">× {i.quantity}</DAOText>
                    </View>
                    <DAOText variant="bodyMedium">{formatMoney(i.line_total, p.currency)}</DAOText>
                  </View>
                ))}
              </DAOCard>

              <DAOCard style={{ gap: spacing.sm }}>
                <Line label={t('cart.subtotal')} value={formatMoney(p.subtotal, p.currency)} />
                {p.member_discount > 0 ? <Line label={t('cart.memberDiscount')} value={`-${formatMoney(p.member_discount, p.currency)}`} /> : null}
                <Line label={t('cart.shipping')} value={p.is_estimate ? t('preorders.shippingTbd') : formatMoney(p.shipping_fee, p.currency)} />
                <Line label={p.is_estimate ? t('preorders.estimatedTotal') : t('cart.total')} value={formatMoney(p.grand_total, p.currency)} />
                {p.is_estimate && !closed ? <DAOText variant="caption" tone="textMuted">{t('preorders.estimateHint')}</DAOText> : null}
              </DAOCard>

              <DAOCard style={{ gap: 4 }}>
                <DAOText variant="subheading">{t('orders.deliveryAddress')}</DAOText>
                <DAOText variant="bodySmall">{p.shipping_address.recipient_name} · {p.shipping_address.phone}</DAOText>
                <DAOText variant="bodySmall" tone="textMuted">{[p.shipping_address.address_line1, p.shipping_address.address_line2, p.shipping_address.subdistrict, p.shipping_address.district, p.shipping_address.region, p.shipping_address.postal_code].filter(Boolean).join(', ')}</DAOText>
              </DAOCard>

              {p.can_pay ? (
                <DAOCard style={{ gap: spacing.md }}>
                  <DAOText variant="subheading">{t('preorders.payTitle')}</DAOText>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    {vm.methods.map((m) => <DAOChip key={m} label={t(`checkout.paymentMethods.${m}`)} selected={vm.method === m} onPress={() => vm.pickMethod(m)} />)}
                  </View>
                  {vm.methods.length === 0 ? <DAOText tone="textMuted">{t('checkout.noPaymentMethods')}</DAOText> : null}
                  {vm.bank ? (
                    <View style={{ gap: spacing.sm }}>
                      <DAOText tone="textMuted">{t('orderSuccess.bankInstructions')}</DAOText>
                      <Line label={t('orderSuccess.bankName')} value={vm.bank.bank_name} />
                      <Line label={t('orderSuccess.accountName')} value={vm.bank.account_name} />
                      <Line label={t('orderSuccess.accountNumber')} value={vm.bank.account_number} />
                      <Line label={t('orderSuccess.promptPay')} value={vm.bank.promptpay_id} />
                      <Line label={t('orderSuccess.amount')} value={vm.bank.amount != null ? formatMoney(vm.bank.amount, vm.bank.currency) : null} />
                      <Line label={t('orderSuccess.reference')} value={vm.bank.reference} />
                    </View>
                  ) : null}
                  <DAOButton label={`${t('orders.payNow')} · ${formatMoney(p.grand_total, p.currency)}`} variant="gold" size="lg" fullWidth onPress={vm.payNow} loading={vm.paying} disabled={!vm.method} />
                </DAOCard>
              ) : null}
              {p.can_cancel ? <DAOButton label={t('preorders.cancel')} variant="danger" fullWidth onPress={vm.askCancel} /> : null}
            </View>
          );
        }}
      </AsyncState>
      <DAOModal visible={vm.confirming} onClose={vm.closeCancel} title={t('preorders.cancel')} message={t('preorders.cancelConfirm')}
        confirmLabel={t('preorders.cancel')} cancelLabel={t('common.back')} onConfirm={vm.doCancel} destructive loading={vm.cancelling} />
    </DAOScreen>
  );
}
