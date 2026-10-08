import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, Linking, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  AsyncState, DAOBadge, DAOButton, DAOChip, DAOHeartButton, DAOIconButton, DAOImage, DAOPrice, DAOProductCard,
  DAOSectionHeader, DAOStar, DAOText, DAOVideoCard, ProductGridSkeleton,
} from '@/shared/components';
import { formatMoney } from '@/shared/utils/format';
import { ratios, useTheme, media } from '@/shared/theme';
import { ProductSection } from '../components/ProductSection';
import { SizeGuideSheet } from '../components/SizeGuideSheet';
import { useProductScreen } from '../hooks/useProductScreen';
import { useStyles } from './ProductScreen.styles';

export default function ProductScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const s = useStyles();
  const vm = useProductScreen();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AsyncState query={vm.product} loading={<View style={{ paddingTop: insets.top + 60 }}><ProductGridSkeleton count={2} /></View>}>
        {(p) => (
          <>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
              <View style={s.gallery}>
                <FlatList
                  horizontal pagingEnabled showsHorizontalScrollIndicator={false} data={vm.images} keyExtractor={(i) => String(i.id)}
                  onMomentumScrollEnd={(e) => vm.setImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
                  renderItem={({ item, index }) => <DAOImage uri={item.url} style={{ width, aspectRatio: ratios.productHero }} priority={index === 0 ? 'high' : 'normal'} accessibilityLabel={item.alt ?? p.name ?? undefined} />}
                />
                <View style={[s.galleryTop, { top: insets.top + 8 }]}>
                  <DAOIconButton icon="chevron-left" tone="glass" accessibilityLabel={t('common.back')} onPress={() => router.back()} />
                  <View style={s.galleryActions}>
                    <DAOIconButton icon="share" tone="glass" accessibilityLabel={t('vlog.share')} onPress={vm.share} />
                    <DAOHeartButton saved={vm.saved} onToggle={vm.toggleSave} size={40} label={t('profile.menu.wishlist')} />
                  </View>
                </View>
                {vm.images.length > 1 ? <View style={s.counter}><DAOText variant="caption" style={{ color: media.text }}>{vm.imageIndex + 1}/{vm.images.length}</DAOText></View> : null}
              </View>
              {vm.images.length > 1 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.thumbs}>
                  {vm.images.map((img, i) => (
                    <View key={img.id} style={[s.thumb, i === vm.imageIndex && s.thumbActive]}><DAOImage uri={img.thumbnail_url ?? img.url} style={{ width: '100%', height: '100%' }} /></View>
                  ))}
                </ScrollView>
              ) : <View style={{ height: spacing.lg }} />}

              <View style={s.body}>
                <View style={{ gap: spacing.xs }}>
                  {p.badges.length ? <View style={{ flexDirection: 'row', gap: 6 }}>{p.badges.map((b) => <DAOBadge key={b} label={t(`shop.badges.${b}`)} tone={b === 'vip' ? 'midnight' : b === 'dao_pick' ? 'gold' : 'sage'} star={b === 'dao_pick'} />)}</View> : null}
                  <View style={s.titleRow}>
                    <DAOText variant="title" style={{ flex: 1 }}>{p.name}</DAOText>
                    {p.rating_count > 0 ? (
                      <View style={s.rating} accessibilityLabel={`${p.rating_avg} / 5`}>
                        <DAOStar size={12} />
                        <DAOText variant="bodySmall">{p.rating_avg.toFixed(1)}</DAOText>
                        <DAOText variant="caption" tone="textSubtle">({p.rating_count})</DAOText>
                      </View>
                    ) : null}
                  </View>
                </View>
                <DAOPrice price={p.price} salePrice={p.sale_price} currency={p.currency} size="lg" />
                {p.pricing?.is_member_price ? (
                  <View style={s.memberLine}>
                    <DAOStar size={10} />
                    <DAOText variant="bodySmall" tone="gold">{t('shop.yourPrice', { tier: p.pricing.tier ?? '' })} · {formatMoney(p.pricing.your_price, p.currency)}</DAOText>
                  </View>
                ) : p.member_price ? <DAOText variant="bodySmall" tone="gold">{t('shop.memberPrice')} {formatMoney(p.member_price, p.currency)}</DAOText> : null}

                {vm.colors.length > 0 ? (
                  <View>
                    <View style={s.labelRow}><DAOText variant="subheading">{t('shop.colors')}</DAOText><DAOText variant="bodySmall" tone="textMuted">{vm.activeColor}</DAOText></View>
                    <View style={s.swatches} accessibilityRole="radiogroup">
                      {vm.colors.map((c) => (
                        <Pressable key={c.name} accessibilityRole="radio" accessibilityLabel={c.name} accessibilityState={{ selected: c.name === vm.activeColor }} onPress={() => vm.setColor(c.name)} style={[s.swatch, c.name === vm.activeColor && s.swatchRing]}>
                          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: c.hex ?? colors.surfaceMuted }} />
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}

                {vm.needsSize ? (
                  <View>
                    <View style={s.labelRow}>
                      <DAOText variant="subheading">{t('shop.sizes')}</DAOText>
                      <Pressable accessibilityRole="button" onPress={vm.openSizeGuide}><DAOText variant="bodySmall" tone="primary">{t('shop.sizeGuide')}</DAOText></Pressable>
                    </View>
                    <View style={s.sizes}>
                      {vm.sizes.map((size) => <DAOChip key={size} label={size} selected={vm.size === size} disabled={vm.sizeState(size) === 'out_of_stock'} onPress={() => vm.setSize(size)} />)}
                    </View>
                  </View>
                ) : null}

                {vm.variant?.stock_status === 'low_stock' && vm.variant.stock_left ? <DAOText variant="bodySmall" tone="danger">{t('shop.lowStock', { count: vm.variant.stock_left })}</DAOText> : null}
                {vm.variant?.stock_status === 'out_of_stock' ? <DAOText variant="bodySmall" tone="danger">{t('shop.outOfStock')}</DAOText> : null}

                <View>
                  {p.description ? <ProductSection title={t('shop.description')} initiallyOpen><DAOText tone="textMuted">{p.description}</DAOText></ProductSection> : null}
                  {p.materials ? <ProductSection title={t('shop.materials')}><DAOText tone="textMuted">{p.materials}</DAOText></ProductSection> : null}
                  {p.care_instructions ? <ProductSection title={t('shop.care')}><DAOText tone="textMuted">{p.care_instructions}</DAOText></ProductSection> : null}
                  {p.shipping_info ? <ProductSection title={t('shop.shipping')}><DAOText tone="textMuted">{p.shipping_info}</DAOText></ProductSection> : null}
                  <ProductSection title={`${t('shop.reviews')} (${p.rating_count})`}>
                    {(vm.reviews.data?.data.length ?? 0) === 0 ? <DAOText tone="textMuted">{t('shop.noReviews')}</DAOText> : vm.reviews.data?.data.slice(0, 5).map((r) => (
                      <View key={r.id} style={s.review}>
                        <View style={{ flexDirection: 'row', gap: 2 }}>{Array.from({ length: 5 }).map((_, i) => <DAOStar key={i} size={10} color={i < r.rating ? colors.gold : colors.border} />)}</View>
                        {r.body ? <DAOText variant="bodySmall">{r.body}</DAOText> : null}
                        <DAOText variant="caption" tone="textSubtle">{r.user.name}{r.is_verified_purchase ? ` · ${t('shop.verifiedPurchase')}` : ''}</DAOText>
                      </View>
                    ))}
                  </ProductSection>
                </View>
                {vm.openExternal ? (
                  <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(vm.openExternal!)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name="external-link" size={14} color={colors.textMuted} />
                    <DAOText variant="bodySmall" tone="textMuted">{t('shop.externalLink', { platform: 'DAO' })}</DAOText>
                  </Pressable>
                ) : null}
              </View>

              {p.videos.length > 0 ? (
                <View style={{ marginTop: spacing.xxxl }}>
                  <DAOSectionHeader title={t('shop.daoReview')} />
                  <FlatList horizontal data={p.videos} keyExtractor={(v) => String(v.id)} showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: spacing.gutter, gap: spacing.md }} renderItem={({ item }) => <DAOVideoCard video={item} width={170} />} />
                </View>
              ) : null}

              {(vm.related.data?.length ?? 0) > 0 ? (
                <View style={{ marginTop: spacing.xxxl }}>
                  <DAOSectionHeader title={t('shop.related')} />
                  <FlatList horizontal data={vm.related.data} keyExtractor={(r) => String(r.id)} showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: spacing.gutter, gap: spacing.md }} renderItem={({ item }) => <DAOProductCard product={item} width={150} />} />
                </View>
              ) : null}
            </ScrollView>
            <View style={[s.bar, { paddingBottom: insets.bottom + spacing.md }]}>
              <DAOButton label={t('shop.buyNow')} variant="secondary" style={{ flex: 1 }} onPress={vm.buyNow} disabled={vm.adding} />
              <DAOButton label={p.in_stock ? t('shop.addToCart') : t('shop.outOfStock')} icon="shopping-bag" style={{ flex: 1.4 }} onPress={vm.addToCart} loading={vm.adding} disabled={!p.in_stock} />
            </View>
            <SizeGuideSheet visible={vm.sizeGuide} onClose={vm.closeSizeGuide} />
          </>
        )}
      </AsyncState>
    </View>
  );
}
