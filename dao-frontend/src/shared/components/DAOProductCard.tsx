import { router } from 'expo-router';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ProductCard } from '@/types/models';
import type { ProductBadge } from '@/types/enums';
import { useIsSaved } from '@/shared/store/savedStore';
import { ratios, useTheme } from '@/shared/theme';
import { DAOBadge, type BadgeTone } from './DAOBadge';
import { DAOHeartButton } from './DAOHeartButton';
import { DAOImage } from './DAOImage';
import { DAOPrice } from './DAOPrice';
import { DAOText } from './DAOText';

const BADGE_TONES: Record<ProductBadge, BadgeTone> = {
  new: 'neutral', bestseller: 'sage', dao_pick: 'gold', limited: 'rose', vip: 'midnight', sale: 'rose',
};

interface Props {
  product: ProductCard;
  width?: number;
  onToggleSave?: (product: ProductCard) => void;
  style?: StyleProp<ViewStyle>;
}

export function DAOProductCard({ product, width, onToggleSave, style }: Props) {
  const { t } = useTranslation();
  const { radius, spacing } = useTheme();
  const badge = product.badges[0];
  const saved = useIsSaved('product', product.id, product.is_saved);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={product.name ?? ''}
      onPress={() => router.push({ pathname: '/product/[id]', params: { id: String(product.id) } })}
      style={({ pressed }) => [{ width, opacity: pressed ? 0.94 : 1 }, style]}
    >
      <View style={{ borderRadius: radius.md, overflow: 'hidden' }}>
        <DAOImage uri={product.thumbnail_url ?? product.image_url} ratio={ratios.product} accessibilityLabel={product.name ?? undefined} />
        {badge ? (
          <View style={{ position: 'absolute', top: spacing.sm, left: spacing.sm }}>
            <DAOBadge label={t(`shop.badges.${badge}`)} tone={BADGE_TONES[badge]} star={badge === 'dao_pick' || badge === 'vip'} />
          </View>
        ) : null}
        {onToggleSave ? (
          <View style={{ position: 'absolute', top: spacing.sm, right: spacing.sm }}>
            <DAOHeartButton saved={saved} onToggle={() => onToggleSave(product)} label={t('profile.menu.wishlist')} />
          </View>
        ) : null}
        {!product.in_stock ? (
          <View style={{ position: 'absolute', bottom: spacing.sm, left: spacing.sm }}>
            <DAOBadge label={t('shop.outOfStock')} tone="neutral" />
          </View>
        ) : null}
      </View>
      <View style={{ paddingTop: spacing.sm, gap: 2 }}>
        <DAOText variant="bodySmall" numberOfLines={1}>
          {product.name}
        </DAOText>
        <DAOPrice price={product.price} salePrice={product.sale_price} memberPrice={product.member_price} currency={product.currency} size="sm" />
      </View>
    </Pressable>
  );
}
