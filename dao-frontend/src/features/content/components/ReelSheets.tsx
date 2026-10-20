import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DAOBottomSheet, DAOImage, DAOPrice, DAOText } from '@/shared/components';
import { ratios, useTheme } from '@/shared/theme';
import type { ProductCard } from '@/types/models';

/** Products linked to the video ("Related products"). */
export function ReelProductsSheet({ visible, products, onClose, onOpen }: { visible: boolean; products: ProductCard[]; onClose: () => void; onOpen: (id: number) => void }) {
  const { t } = useTranslation();
  const { spacing, radius } = useTheme();
  return (
    <DAOBottomSheet visible={visible} onClose={onClose} title={t('shop.shopTheLook')}>
      <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.md }}>
        {products.map((p) => (
          <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={p.name ?? ''} onPress={() => onOpen(p.id)} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
            <View style={{ width: 64, borderRadius: radius.sm, overflow: 'hidden' }}><DAOImage uri={p.thumbnail_url ?? p.image_url} ratio={ratios.product} /></View>
            <View style={{ flex: 1, gap: 2 }}>
              <DAOText variant="bodyMedium" numberOfLines={2}>{p.name}</DAOText>
              <DAOPrice price={p.price} salePrice={p.sale_price} currency={p.currency} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </DAOBottomSheet>
  );
}
