import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DAOAvatar, DAOBottomSheet, DAOIconButton, DAOImage, DAOInput, DAOPrice, DAOText } from '@/shared/components';
import { ratios, useTheme } from '@/shared/theme';
import type { ProductCard } from '@/types/models';
import { useReelComments } from '../hooks/useReelComments';

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

/** Comments for the playing video. Only mounted for the active reel, so nothing is fetched for the others. */
export function ReelCommentsSheet({ videoId, visible, onClose }: { videoId: number; visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const vm = useReelComments(videoId, visible);
  return (
    <DAOBottomSheet visible={visible} onClose={onClose} title={t('vlog.comments')}>
      <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.md }}>
        {vm.comments.length === 0 ? <DAOText tone="textMuted">{t('vlog.noComments')}</DAOText> : vm.comments.map((c) => (
          <View key={c.id} style={{ flexDirection: 'row', gap: spacing.sm }}>
            <DAOAvatar name={c.user.name} uri={c.user.avatar_url} size={30} />
            <View style={{ flex: 1 }}>
              <DAOText variant="caption" tone="textMuted">{c.user.name}</DAOText>
              <DAOText variant="bodySmall">{c.body}</DAOText>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
        <View style={{ flex: 1 }}><DAOInput value={vm.text} onChangeText={vm.setText} placeholder={t('vlog.commentPlaceholder')} maxLength={1000} /></View>
        <DAOIconButton icon="send" tone="primary" accessibilityLabel={t('vlog.post')} onPress={vm.post} />
      </View>
    </DAOBottomSheet>
  );
}
