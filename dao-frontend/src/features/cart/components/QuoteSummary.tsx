import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DAOText } from '@/shared/components';
import { formatMoney } from '@/shared/utils/format';
import { useTheme } from '@/shared/theme';
import type { Quote } from '@/types/models';

function Row({ label, value, tone }: { label: string; value: string; tone?: 'gold' | 'success' | 'text' }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <DAOText variant="bodySmall" tone="textMuted">{label}</DAOText>
      <DAOText variant="bodySmall" tone={tone ?? 'text'}>{value}</DAOText>
    </View>
  );
}

/** Renders the server quote line by line (the app never recomputes totals). */
export function QuoteSummary({ quote }: { quote: Quote }) {
  const { t } = useTranslation();
  const { spacing, colors } = useTheme();
  const c = quote.currency;
  return (
    <View style={{ gap: spacing.sm }}>
      <Row label={t('cart.subtotal')} value={formatMoney(quote.subtotal, c)} />
      {quote.member_discount > 0 ? <Row label={t('cart.memberDiscount')} value={`−${formatMoney(quote.member_discount, c)}`} tone="gold" /> : null}
      {quote.coupon_discount > 0 ? <Row label={`${t('cart.couponDiscount')} ${quote.coupon_code ?? ''}`} value={`−${formatMoney(quote.coupon_discount, c)}`} tone="success" /> : null}
      {quote.points_discount > 0 ? <Row label={`${t('cart.pointsDiscount')} (${quote.points_redeemed})`} value={`−${formatMoney(quote.points_discount, c)}`} tone="gold" /> : null}
      <Row label={t('cart.shipping')} value={quote.shipping_fee === 0 ? t('cart.free') : formatMoney(quote.shipping_fee, c)} />
      <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: spacing.xs }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <DAOText variant="subheading">{t('cart.total')}</DAOText>
        <DAOText variant="heading">{formatMoney(quote.total, c)}</DAOText>
      </View>
    </View>
  );
}
