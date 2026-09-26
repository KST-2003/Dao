import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AsyncState, DAOChip, DAOHeader, DAOProductCard, DAORecipeCard, DAOScreen, DAOVideoCard, ProductGridSkeleton } from '@/shared/components';
import { useTheme } from '@/shared/theme';
import type { SaveableType } from '@/types/enums';
import { useWishlistScreen } from '../hooks/useWishlistScreen';

const TABS: SaveableType[] = ['product', 'video', 'recipe'];

export default function WishlistScreen() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const vm = useWishlistScreen();
  const empty = { title: t('wishlist.empty') };
  const grid = { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.md };
  const cell = { width: '47.5%' as const };

  return (
    <DAOScreen header={<DAOHeader title={t('wishlist.title')} large />}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.lg }}>
        {TABS.map((tab) => <DAOChip key={tab} label={t(`wishlist.tabs.${tab}`)} selected={vm.tab === tab} onPress={() => vm.setTab(tab)} />)}
      </ScrollView>
      {vm.tab === 'product' ? (
        <AsyncState query={vm.products} isEmpty={(l) => l.length === 0} empty={empty} loading={<ProductGridSkeleton />}>
          {(list) => <View style={grid}>{list.map((p) => <View key={p.id} style={cell}><DAOProductCard product={p} onToggleSave={(x) => vm.toggleSaved('product', x.id, true)} /></View>)}</View>}
        </AsyncState>
      ) : vm.tab === 'video' ? (
        <AsyncState query={vm.videos} isEmpty={(l) => l.length === 0} empty={empty} loading={<ProductGridSkeleton />}>
          {(list) => <View style={grid}>{list.map((v) => <View key={v.id} style={cell}><DAOVideoCard video={v} /></View>)}</View>}
        </AsyncState>
      ) : (
        <AsyncState query={vm.recipes} isEmpty={(l) => l.length === 0} empty={empty} loading={<ProductGridSkeleton />}>
          {(list) => <View style={grid}>{list.map((r) => <View key={r.id} style={cell}><DAORecipeCard recipe={r} /></View>)}</View>}
        </AsyncState>
      )}
    </DAOScreen>
  );
}
