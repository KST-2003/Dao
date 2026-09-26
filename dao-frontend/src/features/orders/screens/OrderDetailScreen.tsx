import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { QuoteSummary } from '@/features/cart/components/QuoteSummary';
import { AsyncState, DAOButton, DAOCard, DAOHeader, DAOImage, DAOModal, DAOScreen, DAOStar, DAOText } from '@/shared/components';
import { useLocale } from '@/shared/hooks/useLocale';
import { formatDate, formatMoney, formatNumber } from '@/shared/utils/format';
import { useTheme } from '@/shared/theme';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { useOrderDetailScreen } from '../hooks/useOrderDetailScreen';

export default function OrderDetailScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { spacing, colors, radius } = useTheme();
  const vm = useOrderDetailScreen();

  return (
    <DAOScreen header={<DAOHeader title={vm.order.data?.order_number ?? t('orders.title')} />} refreshing={vm.order.isRefetching} onRefresh={() => void vm.order.refetch()}>
      <AsyncState query={vm.order}>
        {(o) => (
          <View style={{ gap: spacing.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <DAOText variant="caption" tone="textMuted">{t('orders.placedOn', { date: formatDate(o.placed_at, locale, true) })}</DAOText>
              <OrderStatusBadge status={o.status} />
            </View>

            {o.timeline?.length ? (
              <DAOCard style={{ gap: spacing.md }}>
                <DAOText variant="subheading">{t('orders.timeline')}</DAOText>
                {o.timeline.map((step, i) => (
                  <View key={`${step.status}-${i}`} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i === o.timeline!.length - 1 ? colors.primary : colors.border }} />
                    <DAOText variant="bodySmall" style={{ flex: 1 }}>{t(`orders.status.${step.status}`)}</DAOText>
                    <DAOText variant="caption" tone="textSubtle">{formatDate(step.at, locale, true)}</DAOText>
                  </View>
                ))}
              </DAOCard>
            ) : null}

            {o.shipment?.tracking_number ? (
              <DAOCard style={{ gap: spacing.sm }}>
                <DAOText variant="subheading">{t('orders.tracking')}</DAOText>
                <DAOText selectable>{o.shipment.carrier} · {o.shipment.tracking_number}</DAOText>
                {o.shipment.tracking_url ? <DAOButton label={t('orders.trackPackage')} variant="secondary" size="sm" onPress={vm.track} style={{ alignSelf: 'flex-start' }} /> : null}
              </DAOCard>
            ) : null}

            <DAOCard style={{ gap: spacing.md }}>
              {(o.items ?? []).map((i) => (
                <View key={i.id} style={{ flexDirection: 'row', gap: spacing.md }}>
                  <View style={{ width: 56, borderRadius: radius.sm, overflow: 'hidden' }}><DAOImage uri={i.image_url} ratio={3 / 4} /></View>
                  <View style={{ flex: 1 }}>
                    <DAOText variant="bodyMedium">{i.name}</DAOText>
                    {i.variant_label ? <DAOText variant="caption" tone="textMuted">{i.variant_label}</DAOText> : null}
                    <DAOText variant="caption" tone="textMuted">× {i.quantity}</DAOText>
                  </View>
                  <DAOText variant="bodyMedium">{formatMoney(i.line_total, o.currency)}</DAOText>
                </View>
              ))}
            </DAOCard>

            <DAOCard>
              <QuoteSummary quote={{
                currency: o.currency, subtotal: o.subtotal, member_discount: o.member_discount, coupon_code: o.coupon_code, coupon_discount: o.coupon_discount,
                points_redeemed: o.points_redeemed, points_discount: o.points_discount, delivery_method: o.delivery_method, shipping_fee: o.shipping_fee,
                free_shipping_threshold: 0, total: o.grand_total, points_to_earn: o.points_earned,
              }} />
              {o.points_earned > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md }}>
                  <DAOStar size={12} /><DAOText variant="bodySmall" tone="gold">{t('orders.pointsEarned')}: +{formatNumber(o.points_earned)}</DAOText>
                </View>
              ) : null}
            </DAOCard>

            <DAOCard style={{ gap: 4 }}>
              <DAOText variant="subheading">{t('orders.deliveryAddress')}</DAOText>
              <DAOText variant="bodySmall">{o.shipping_address.recipient_name} · {o.shipping_address.phone}</DAOText>
              <DAOText variant="bodySmall" tone="textMuted">{[o.shipping_address.address_line1, o.shipping_address.address_line2, o.shipping_address.subdistrict, o.shipping_address.district, o.shipping_address.region, o.shipping_address.postal_code].filter(Boolean).join(', ')}</DAOText>
            </DAOCard>

            {vm.canPay ? <DAOButton label={t('orders.payNow')} variant="gold" size="lg" fullWidth onPress={vm.pay} loading={vm.paying} /> : null}
            {o.can_cancel ? <DAOButton label={t('orders.cancelOrder')} variant="danger" fullWidth onPress={vm.askCancel} /> : null}
          </View>
        )}
      </AsyncState>
      <DAOModal visible={vm.confirming} onClose={vm.closeCancel} title={t('orders.cancelOrder')} message={t('orders.cancelConfirm')}
        confirmLabel={t('orders.cancelOrder')} cancelLabel={t('common.back')} onConfirm={vm.doCancel} destructive loading={vm.cancelling} />
    </DAOScreen>
  );
}
