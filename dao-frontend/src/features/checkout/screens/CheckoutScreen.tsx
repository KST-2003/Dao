import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { QuoteSummary } from '@/features/cart/components/QuoteSummary';
import { DAOButton, DAOCard, DAOHeader, DAOInput, DAOLoadingSkeleton, DAOQuantityStepper, DAOScreen, DAOText } from '@/shared/components';
import { formatMoney, formatNumber } from '@/shared/utils/format';
import { useTheme } from '@/shared/theme';
import { useCheckoutScreen } from '../hooks/useCheckoutScreen';
import { useStyles } from './CheckoutScreen.styles';

function Radio({ selected }: { selected: boolean }) {
  const { colors } = useTheme();
  return <Feather name={selected ? 'check-circle' : 'circle'} size={20} color={selected ? colors.primary : colors.border} />;
}

export default function CheckoutScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { spacing } = useTheme();
  const s = useStyles();
  const vm = useCheckoutScreen();
  const a = vm.address;

  const footer = (
    <View style={[s.footer, { paddingBottom: insets.bottom + spacing.md }]}>
      {vm.quoteError ? <DAOText variant="caption" tone="danger" align="center">{vm.quoteError}</DAOText> : null}
      {vm.quote.data && vm.quote.data.points_to_earn > 0 ? <DAOText variant="caption" tone="gold" align="center">{t('checkout.pointsToEarn', { points: formatNumber(vm.quote.data.points_to_earn) })}</DAOText> : null}
      <DAOButton label={`${t('checkout.placeOrder')}${vm.quote.data ? ` · ${formatMoney(vm.quote.data.total)}` : ''}`} size="lg" fullWidth onPress={vm.submit} loading={vm.placing} disabled={!vm.canPlace} />
    </View>
  );

  return (
    <DAOScreen header={<DAOHeader title={t('checkout.title')} />} footer={footer}>
      <View style={s.section}>
        <DAOText variant="heading">{t('checkout.address')}</DAOText>
        {a ? (
          <DAOCard style={{ gap: 4 }}>
            <DAOText variant="bodyMedium">{a.recipient_name} · {a.phone}</DAOText>
            <DAOText variant="bodySmall" tone="textMuted">{[a.address_line1, a.address_line2, a.subdistrict, a.district, a.region, a.postal_code].filter(Boolean).join(', ')}</DAOText>
            {(vm.addresses.data?.length ?? 0) > 1 ? (
              <View style={[s.row, { marginTop: spacing.sm, flexWrap: 'wrap' }]}>
                {vm.addresses.data!.map((x) => (
                  <Pressable key={x.id} onPress={() => vm.setAddressId(x.id)} style={s.row}>
                    <Radio selected={x.id === vm.addressId} />
                    <DAOText variant="caption">{x.label ?? x.recipient_name}</DAOText>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </DAOCard>
        ) : vm.addresses.isPending ? <DAOLoadingSkeleton height={80} /> : null}
        <DAOButton label={t('checkout.addAddress')} variant="ghost" icon="plus" onPress={vm.addAddress} style={{ alignSelf: 'flex-start' }} />
      </View>

      <View style={s.section}>
        <DAOText variant="heading">{t('checkout.delivery')}</DAOText>
        {(vm.options.data?.delivery_methods ?? []).map((d) => (
          <Pressable key={d.code} accessibilityRole="radio" accessibilityState={{ selected: vm.delivery === d.code }} onPress={() => vm.setDelivery(d.code)} style={[s.option, vm.delivery === d.code && s.optionActive]}>
            <Radio selected={vm.delivery === d.code} />
            <DAOText style={{ flex: 1 }}>{t(`checkout.deliveryMethods.${d.code}`)}</DAOText>
            <DAOText variant="bodySmall" tone="textMuted">{formatMoney(d.fee)}</DAOText>
          </Pressable>
        ))}
      </View>

      <View style={s.section}>
        <DAOText variant="heading">{t('checkout.payment')}</DAOText>
        {vm.options.data && vm.options.data.payment_methods.length === 0 ? <DAOText tone="textMuted">{t('checkout.noPaymentMethods')}</DAOText> : null}
        {(vm.options.data?.payment_methods ?? []).map((m) => (
          <Pressable key={m} accessibilityRole="radio" accessibilityState={{ selected: vm.payment === m }} onPress={() => vm.setPayment(m)} style={[s.option, vm.payment === m && s.optionActive]}>
            <Radio selected={vm.payment === m} />
            <DAOText style={{ flex: 1 }}>{t(`checkout.paymentMethods.${m}`)}</DAOText>
          </Pressable>
        ))}
      </View>

      <View style={s.section}>
        <DAOText variant="heading">{t('checkout.promo')}</DAOText>
        {vm.coupon ? (
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <DAOText variant="bodyMedium" tone="primary">{vm.coupon}</DAOText>
            <DAOButton label={t('cart.remove')} variant="ghost" size="sm" onPress={vm.clearCoupon} />
          </View>
        ) : (
          <View style={[s.row, { alignItems: 'flex-start' }]}>
            <View style={{ flex: 1 }}><DAOInput value={vm.couponInput} onChangeText={vm.setCouponInput} autoCapitalize="characters" placeholder="DAO10" /></View>
            <DAOButton label={t('common.apply')} variant="secondary" onPress={vm.applyCoupon} disabled={!vm.couponInput.trim()} />
          </View>
        )}
      </View>

      {vm.maxPoints > 0 ? (
        <View style={s.section}>
          <DAOText variant="heading">{t('cart.usePoints')}</DAOText>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <View>
              <DAOText>{t('checkout.redeemPoints', { points: formatNumber(vm.points) })}</DAOText>
              <DAOText variant="caption" tone="textMuted">{t('cart.pointsAvailable', { points: formatNumber(vm.balance) })}</DAOText>
            </View>
            <DAOQuantityStepper value={vm.points / vm.unit} min={0} max={vm.maxPoints / vm.unit} onChange={(n) => vm.setPoints(n * vm.unit)} />
          </View>
        </View>
      ) : null}

      <View style={s.section}>
        <DAOInput label={`${t('checkout.notes')} · ${t('common.optional')}`} value={vm.notes} onChangeText={vm.setNotes} placeholder={t('checkout.notesPlaceholder')} multiline maxLength={500} />
      </View>

      <DAOCard>
        <DAOText variant="heading" style={{ marginBottom: spacing.md }}>{t('checkout.summary')}</DAOText>
        {vm.quote.data ? <QuoteSummary quote={vm.quote.data} /> : <DAOLoadingSkeleton height={120} />}
      </DAOCard>
    </DAOScreen>
  );
}
