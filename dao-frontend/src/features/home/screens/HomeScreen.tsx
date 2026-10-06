import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, Pressable, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import {
  AsyncState, DAOButton, DAOCollectionCard, DAOIconButton, DAOImage, DAOLogo, DAOPointCard, DAOProductCard,
  DAORecipeCard, DAOScreen, DAOSectionHeader, DAOStar, DAOText, DAOVideoCard, ProductGridSkeleton,
} from '@/shared/components';
import { ratios, media, gradients } from '@/shared/theme';
import type { Banner, ProductCard } from '@/types/models';
import { useHomeScreen } from '../hooks/useHomeScreen';
import { useStyles } from './HomeScreen.styles';

function ProductRail({ products, onToggleSave }: { products: ProductCard[]; onToggleSave: (p: ProductCard) => void }) {
  const s = useStyles();
  return (
    <FlatList
      horizontal
      data={products}
      keyExtractor={(p) => String(p.id)}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.rail}
      renderItem={({ item }) => <DAOProductCard product={item} width={156} onToggleSave={onToggleSave} />}
    />
  );
}

function HeroCarousel({
  hero, width, index, onScrollEnd, onOpen, ctaLabel,
}: {
  hero: Banner[]; width: number; index: number;
  onScrollEnd: (e: NativeSyntheticEvent<NativeScrollEvent>) => void; onOpen: (b: Banner) => void; ctaLabel: string;
}) {
  const s = useStyles();
  return (
    <View>
      <FlatList
        horizontal
        pagingEnabled
        data={hero}
        keyExtractor={(b) => String(b.id)}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={hero.length > 1 ? onScrollEnd : undefined}
        renderItem={({ item: b }) => {
          const light = b.theme === 'botanical';
          return (
            <View style={{ width }}>
              <Pressable accessibilityRole="button" onPress={() => onOpen(b)} style={s.hero}>
                <DAOImage uri={b.image_url} ratio={ratios.hero} priority="high" />
                <LinearGradient colors={light ? gradients.photoFadeLight : gradients.photoFade} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' }} />
                <View style={s.heroText}>
                  {b.eyebrow ? <DAOText variant="overline" style={{ color: light ? media.textOnLightMuted : media.textMuted }}>{b.eyebrow}</DAOText> : null}
                  <DAOText variant="brand" style={[s.heroTitle, { color: light ? media.textOnLight : media.text }]}>{b.title}</DAOText>
                  {b.subtitle ? <DAOText style={{ color: light ? media.textOnLightMuted : media.textMuted }}>{b.subtitle}</DAOText> : null}
                  <View style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                    <DAOButton
                      label={b.cta_label ?? ctaLabel} variant="secondary" size="sm"
                      style={{ backgroundColor: light ? media.textOnLight : media.text, borderColor: light ? media.textOnLight : media.text }}
                      onPress={() => onOpen(b)}
                    />
                  </View>
                </View>
              </Pressable>
            </View>
          );
        }}
      />
      {hero.length > 1 ? (
        <View style={s.heroDots}>
          {hero.map((b, i) => <View key={b.id} style={[s.heroDot, i === index && s.heroDotActive]} />)}
        </View>
      ) : null}
    </View>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const s = useStyles();
  const vm = useHomeScreen(width);

  const header = (
    <View style={{ paddingTop: insets.top + 6 }}>
      <View style={s.topBar}>
        <DAOLogo size={30} />
        <View style={s.topActions}>
          <DAOIconButton icon="search" accessibilityLabel={t('common.search')} onPress={vm.goSearch} />
          <View>
            <DAOIconButton icon="bell" accessibilityLabel={t('notifications.title')} onPress={vm.goNotifications} />
            {vm.unread > 0 ? <View style={s.dot} /> : null}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <DAOScreen header={header} padded={false} refreshing={vm.home.isRefetching} onRefresh={() => void vm.home.refetch()}>
      <View style={s.greeting}>
        <Pressable disabled={!vm.greetingOrderId} onPress={() => vm.greetingOrderId && vm.goOrder(vm.greetingOrderId)}>
          <DAOText variant="heading" italic>{vm.greeting}</DAOText>
        </Pressable>
      </View>
      <AsyncState query={vm.home} loading={<ProductGridSkeleton />}>
        {(home) => (
          <>
            {home.hero.length > 0 ? (
              <HeroCarousel hero={home.hero} width={width} index={vm.heroIndex} onScrollEnd={vm.onHeroScrollEnd} onOpen={vm.openBanner} ctaLabel={t('home.shopNow')} />
            ) : null}

            {home.new_arrivals.length > 0 ? (
              <View style={s.section}>
                <DAOSectionHeader title={t('home.newArrivals')} onViewAll={vm.goShop} />
                <ProductRail products={home.new_arrivals} onToggleSave={vm.onToggleSave} />
              </View>
            ) : null}

            {home.dao_picks.length > 0 ? (
              <View style={s.section}>
                <DAOSectionHeader title={t('home.daoPicks')} subtitle={t('home.daoPicksSubtitle')} />
                <ProductRail products={home.dao_picks} onToggleSave={vm.onToggleSave} />
              </View>
            ) : null}

            {home.featured_collection ? (
              <View style={[s.section, s.collection]}>
                <DAOSectionHeader title={t('home.featuredCollection')} padded={false} onViewAll={() => vm.goCollection(home.featured_collection!.slug)} />
                <DAOCollectionCard collection={home.featured_collection} />
              </View>
            ) : null}

            {home.from_dao.length > 0 ? (
              <View style={s.section}>
                <DAOSectionHeader title={t('home.fromDao')} onViewAll={vm.goVlog} />
                <FlatList horizontal data={home.from_dao} keyExtractor={(v) => String(v.id)} showsHorizontalScrollIndicator={false} contentContainerStyle={s.rail}
                  renderItem={({ item }) => <DAOVideoCard video={item} width={170} />} />
              </View>
            ) : null}

            {home.kitchen.length > 0 ? (
              <View style={s.section}>
                <DAOSectionHeader title={t('home.daoKitchen')} subtitle={t('home.daoKitchenSubtitle')} onViewAll={vm.goKitchen} />
                <View style={s.kitchenRow}>
                  {home.kitchen.slice(0, 2).map((r) => (
                    <View key={r.id} style={{ flex: 1 }}>
                      <DAORecipeCard recipe={r} />
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={s.section}>
              <DAOSectionHeader title={t('home.memberBenefits')} />
              {home.membership ? (
                <View style={s.member}>
                  <DAOPointCard tier={home.membership.tier} balance={home.membership.balance} progress={home.membership.progress}
                    pointsToNext={home.membership.points_to_next} nextTierName={home.membership.next_tier} onPress={vm.goMembership} />
                </View>
              ) : (
                <View style={s.join}>
                  <DAOStar size={22} />
                  <DAOText variant="heading">{t('home.joinTitle')}</DAOText>
                  <DAOText tone="textMuted">{t('home.joinBody')}</DAOText>
                  <DAOButton label={t('auth.signIn')} variant="gold" onPress={vm.goMembership} style={{ alignSelf: 'flex-start' }} />
                </View>
              )}
            </View>
          </>
        )}
      </AsyncState>
    </DAOScreen>
  );
}
