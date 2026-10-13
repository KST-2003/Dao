import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AsyncState, DAOButton, DAOCard, DAOHeader, DAOImage, DAOInput, DAOQuantityStepper, DAOScreen, DAOText } from '@/shared/components';
import { formatMoney } from '@/shared/utils/format';
import { useTheme } from '@/shared/theme';
import { usePreorderNewScreen } from '../hooks/usePreorderNewScreen';

export default function PreorderNewScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { spacing, colors, radius } = useTheme();
  const vm = usePreorderNewScreen();
  const a = vm.address;
  const q = vm.quote.data;

  const footer = (
    <View style={{ paddingHorizontal: spacing.gutter, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, borderTopWidth: 1, borderTopColor: colors.divider, backgroundColor: colors.background, gap: spacing.sm }}>
      {vm.quoteError ? <DAOText variant="caption" tone="danger" align="center">{vm.quoteError}</DAOText> : null}
      <DAOButton label={`${t('preorders.submit')}${q ? ` · ${formatMoney(q.total, q.currency)}` : ''}`} size="lg" fullWidth onPress={vm.place} loading={vm.placing} disabled={!vm.canPlace} />
    </View>
  );

  return (
    <DAOScreen header={<DAOHeader title={t('preorders.newTitle')} />} footer={footer}>
      <AsyncState query={vm.product}>
        {(p) => (
          <View style={{ gap: spacing.xl }}>
            <DAOCard style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ width: 72, borderRadius: radius.sm, overflow: 'hidden' }}><DAOImage uri={p.images[0]?.thumbnail_url ?? p.image_url} ratio={3 / 4} /></View>
              <View style={{ flex: 1, gap: 4 }}>
                <DAOText variant="bodyMedium">{p.name}</DAOText>
                {vm.variant ? <DAOText variant="caption" tone="textMuted">{[vm.variant.color, vm.variant.size].filter(Boolean).join(' / ')}</DAOText> : null}
                {vm.rule?.min_qty ? <DAOText variant="caption" tone="gold">{t('preorders.minQty', { min: String(vm.rule.min_qty) })}</DAOText> : null}
                {vm.rule?.max_qty ? <DAOText variant="caption" tone="gold">{t('preorders.maxQty', { max: String(vm.rule.max_qty) })}</DAOText> : null}
                {vm.rule?.remaining != null ? <DAOText variant="caption" tone="textMuted">{t('preorders.remaining', { count: vm.rule.remaining })}</DAOText> : null}
              </View>
            </DAOCard>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <DAOText variant="heading">{t('preorders.quantity')}</DAOText>
              <DAOQuantityStepper value={vm.quantity} min={vm.min} max={Math.max(vm.min, vm.max)} onChange={vm.setQty} />
            </View>

            <View style={{ gap: spacing.md }}>
              <DAOText variant="heading">{t('checkout.address')}</DAOText>
              {a ? (
                <DAOCard style={{ gap: 4 }}>
                  <DAOText variant="bodyMedium">{a.recipient_name} · {a.phone}</DAOText>
                  <DAOText variant="bodySmall" tone="textMuted">{[a.address_line1, a.address_line2, a.subdistrict, a.district, a.region, a.postal_code].filter(Boolean).join(', ')}</DAOText>
                  <DAOText variant="caption" tone="gold">{t(`preorders.destination.${a.country_code === 'MM' ? 'myanmar' : 'thailand'}`)}</DAOText>
                  {(vm.addresses.data?.length ?? 0) > 1 ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm }}>
                      {vm.addresses.data!.map((x) => (
                        <Pressable key={x.id} onPress={() => vm.setAddressId(x.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                          <Feather name={x.id === a.id ? 'check-circle' : 'circle'} size={20} color={x.id === a.id ? colors.primary : colors.border} />
                          <DAOText variant="caption">{x.label ?? x.recipient_name}</DAOText>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </DAOCard>
              ) : null}
              <DAOButton label={t('checkout.addAddress')} variant="ghost" icon="plus" onPress={vm.addAddress} style={{ alignSelf: 'flex-start' }} />
            </View>

            <DAOInput label={`${t('checkout.notes')} · ${t('common.optional')}`} value={vm.notes} onChangeText={vm.setNotes} placeholder={t('checkout.notesPlaceholder')} multiline maxLength={500} />

            <DAOCard style={{ gap: spacing.sm }}>
              <DAOText variant="heading">{t('checkout.summary')}</DAOText>
              {q ? (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><DAOText tone="textMuted">{t('cart.subtotal')}</DAOText><DAOText>{formatMoney(q.subtotal, q.currency)}</DAOText></View>
                  {q.member_discount > 0 ? <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><DAOText tone="textMuted">{t('cart.memberDiscount')}</DAOText><DAOText>-{formatMoney(q.member_discount, q.currency)}</DAOText></View> : null}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><DAOText variant="bodyMedium">{t('preorders.estimatedTotal')}</DAOText><DAOText variant="price">{formatMoney(q.total, q.currency)}</DAOText></View>
                </>
              ) : null}
              <DAOText variant="caption" tone="textMuted">{t('preorders.howItWorks')}</DAOText>
            </DAOCard>
          </View>
        )}
      </AsyncState>
    </DAOScreen>
  );
}
