import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DAOImage, DAOQuantityStepper, DAOText } from '@/shared/components';
import { formatMoney } from '@/shared/utils/format';
import { useTheme } from '@/shared/theme';
import type { CartIssue, CartItem } from '@/types/models';

interface Props {
  item: CartItem;
  issue?: CartIssue;
  disabled?: boolean;
  onQuantity: (q: number) => void;
  onRemove: () => void;
  onSaveForLater: (saved: boolean) => void;
  onAcceptPrice: () => void;
}

export function CartLine({ item, issue, disabled, onQuantity, onRemove, onSaveForLater, onAcceptPrice }: Props) {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const issueText = issue
    ? issue.code === 'insufficient_stock' ? t('cart.issues.insufficient_stock', { available: String(issue.available ?? 0) })
      : issue.code === 'price_changed' ? t('cart.issues.price_changed', { old: formatMoney(issue.old_price), new: formatMoney(issue.new_price) })
      : t(`cart.issues.${issue.code}`)
    : null;
  return (
    <View style={{ flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.divider, opacity: item.saved_for_later ? 0.85 : 1 }}>
      <View style={{ width: 84, borderRadius: radius.sm, overflow: 'hidden' }}>
        <DAOImage uri={item.image_url} ratio={3 / 4} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <DAOText variant="bodyMedium" numberOfLines={2}>{item.name}</DAOText>
        {item.variant_label ? <DAOText variant="caption" tone="textMuted">{item.variant_label}</DAOText> : null}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <DAOText variant="price">{formatMoney(item.member_unit_price ?? item.unit_price)}</DAOText>
          {item.member_unit_price != null && item.unit_price != null && item.member_unit_price < item.unit_price ? (
            <DAOText variant="caption" tone="textSubtle" style={{ textDecorationLine: 'line-through' }}>{formatMoney(item.unit_price)}</DAOText>
          ) : null}
        </View>
        {issueText ? (
          <View style={{ backgroundColor: issue?.code === 'price_changed' ? colors.goldSoft : colors.dangerSoft, borderRadius: radius.sm, padding: spacing.sm, gap: 4 }} accessibilityLiveRegion="polite">
            <DAOText variant="caption" tone={issue?.code === 'price_changed' ? 'text' : 'danger'}>{issueText}</DAOText>
            {issue?.code === 'price_changed' ? <Pressable onPress={onAcceptPrice}><DAOText variant="caption" tone="primary">{t('cart.acceptPrice')}</DAOText></Pressable> : null}
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs }}>
          {!item.saved_for_later ? <DAOQuantityStepper value={item.quantity} max={Math.max(item.quantity, item.max_quantity)} onChange={onQuantity} disabled={disabled} /> : <View />}
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Pressable accessibilityRole="button" onPress={() => onSaveForLater(!item.saved_for_later)}>
              <DAOText variant="caption" tone="primary">{item.saved_for_later ? t('cart.moveToBag') : t('cart.saveForLater')}</DAOText>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onRemove}>
              <DAOText variant="caption" tone="textMuted">{t('cart.remove')}</DAOText>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
