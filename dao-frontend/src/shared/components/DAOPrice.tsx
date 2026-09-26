import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '@/shared/utils/format';
import { useTheme } from '@/shared/theme';
import { DAOText } from './DAOText';

interface DAOPriceProps {
  price: number;
  salePrice?: number | null;
  memberPrice?: number | null;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  showMemberLine?: boolean;
}

/** Regular / sale / member price, always from server values (minor units). */
export function DAOPrice({ price, salePrice, memberPrice, currency = 'THB', size = 'md', showMemberLine }: DAOPriceProps) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const current = salePrice ?? price;
  const variant = size === 'lg' ? 'title' : size === 'md' ? 'price' : 'bodyMedium';
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}>
        <DAOText variant={variant} tone={salePrice ? 'danger' : 'text'} accessibilityLabel={formatMoney(current, currency)}>
          {formatMoney(current, currency)}
        </DAOText>
        {salePrice ? (
          <DAOText variant="caption" tone="textSubtle" style={{ textDecorationLine: 'line-through' }}>
            {formatMoney(price, currency)}
          </DAOText>
        ) : null}
      </View>
      {showMemberLine && memberPrice != null && memberPrice < current ? (
        <DAOText variant="caption" tone="gold">
          {t('shop.memberPrice')} {formatMoney(memberPrice, currency)}
        </DAOText>
      ) : null}
    </View>
  );
}
