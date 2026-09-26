import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AsyncState, DAOButton, DAOCard, DAOEmptyState, DAOHeader, DAOInput, DAOScreen, DAOStar, DAOText } from '@/shared/components';
import { formatMoney } from '@/shared/utils/format';
import { useTheme } from '@/shared/theme';
import { CartLine } from '../components/CartLine';
import { QuoteSummary } from '../components/QuoteSummary';
import { useCartScreen } from '../hooks/useCartScreen';

export default function CartScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { spacing, colors } = useTheme();
  const vm = useCartScreen();

  if (!vm.signedIn) {
    return (
      <DAOScreen header={<DAOHeader title={t('cart.title')} />}>
        <DAOEmptyState title={t('auth.signInRequired')} message={t('auth.signInRequiredHint')} actionLabel={t('auth.signIn')} onAction={vm.signIn} />
      </DAOScreen>
    );
  }

  const footer = vm.cart.data && vm.cart.data.items.length > 0 ? (
    <View style={{ padding: spacing.gutter, paddingBottom: insets.bottom + spacing.md, borderTopWidth: 1, borderTopColor: colors.divider, backgroundColor: colors.background, gap: spacing.sm }}>
      {!vm.cart.data.can_checkout ? <DAOText variant="caption" tone="danger" align="center">{t('cart.fixIssues')}</DAOText> : null}
      <DAOButton label={`${t('cart.checkout')} · ${formatMoney(vm.cart.data.quote.total)}`} size="lg" fullWidth onPress={vm.checkout} disabled={!vm.cart.data.can_checkout || vm.busy} />
    </View>
  ) : null;

  return (
    <DAOScreen header={<DAOHeader title={t('cart.title')} />} footer={footer} refreshing={vm.cart.isRefetching} onRefresh={() => void vm.cart.refetch()}>
      <AsyncState query={vm.cart} isEmpty={(c) => c.items.length === 0 && c.saved_for_later.length === 0}
        empty={{ title: t('cart.empty'), message: t('cart.emptyHint'), actionLabel: t('cart.exploreDao'), onAction: vm.explore }}>
        {(cart) => (
          <View style={{ gap: spacing.lg }}>
            {vm.toFreeShipping !== null && cart.items.length > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primarySoft, borderRadius: 12, padding: spacing.md }}>
                <DAOStar size={12} color={colors.primary} />
                <DAOText variant="bodySmall" tone="primary">{vm.toFreeShipping > 0 ? t('cart.freeShippingProgress', { amount: formatMoney(vm.toFreeShipping) }) : t('cart.freeShippingUnlocked')}</DAOText>
              </View>
            ) : null}
            <View>
              {cart.items.map((item) => (
                <CartLine key={item.id} item={item} issue={vm.issueFor(item.id)} disabled={vm.busy}
                  onQuantity={(q) => vm.setQuantity(item.id, q)} onRemove={() => vm.remove(item.id)}
                  onSaveForLater={(saved) => vm.saveForLater(item.id, saved)} onAcceptPrice={() => vm.acceptPrice(item.id)} />
              ))}
            </View>
            {cart.items.length > 0 ? (
              <DAOCard style={{ gap: spacing.md }}>
                <DAOText variant="subheading">{t('cart.promoCode')}</DAOText>
                {cart.coupon_code ? (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <DAOText variant="bodyMedium" tone="primary">{cart.coupon_code}</DAOText>
                    <DAOButton label={t('cart.remove')} variant="ghost" size="sm" onPress={vm.removePromo} />
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}><DAOInput value={vm.promo} onChangeText={vm.setPromo} autoCapitalize="characters" placeholder="DAO10" /></View>
                    <DAOButton label={t('common.apply')} variant="secondary" onPress={vm.applyPromo} loading={vm.applying} disabled={!vm.promo.trim()} />
                  </View>
                )}
                {cart.option_error ? <DAOText variant="caption" tone="danger">{t('cart.optionError')}: {cart.option_error.message}</DAOText> : null}
                <QuoteSummary quote={cart.quote} />
                {cart.quote.points_to_earn > 0 ? <DAOText variant="caption" tone="gold">{t('checkout.pointsToEarn', { points: String(cart.quote.points_to_earn) })}</DAOText> : null}
              </DAOCard>
            ) : null}
            {cart.saved_for_later.length > 0 ? (
              <View>
                <DAOText variant="heading" style={{ marginTop: spacing.lg }}>{t('cart.savedForLater')}</DAOText>
                {cart.saved_for_later.map((item) => (
                  <CartLine key={item.id} item={item} issue={vm.issueFor(item.id)} onQuantity={() => undefined} onRemove={() => vm.remove(item.id)}
                    onSaveForLater={(saved) => vm.saveForLater(item.id, saved)} onAcceptPrice={() => vm.acceptPrice(item.id)} />
                ))}
              </View>
            ) : null}
          </View>
        )}
      </AsyncState>
    </DAOScreen>
  );
}
