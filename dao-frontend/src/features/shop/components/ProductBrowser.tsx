import { Feather } from '@expo/vector-icons';
import { useMemo, useState, type ReactElement } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  DAOBottomSheet, DAOButton, DAOChip, DAOEmptyState, DAOErrorState, DAOLoadingSkeleton, DAOProductGrid, DAOText, ProductGridSkeleton,
} from '@/shared/components';
import type { ProductFilters } from '@/shared/constants/queryKeys';
import { useTheme } from '@/shared/theme';
import type { ProductSort } from '@/types/enums';
import type { ProductCard } from '@/types/models';
import { useProducts, useToggleSaved } from '../api';

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const SORTS: ProductSort[] = ['newest', 'popular', 'price_asc', 'price_desc', 'rating'];

/** Product grid with sort + filters (size, color, sale, stock). Shared by Shop, Category and Collection. */
export function ProductBrowser({ base, header }: { base: ProductFilters; header?: ReactElement }) {
  const { t } = useTranslation();
  const { spacing, colors } = useTheme();
  const [extra, setExtra] = useState<ProductFilters>({ sort: 'newest' });
  const [sheet, setSheet] = useState(false);
  const filters = useMemo(() => ({ ...base, ...extra }), [base, extra]);
  const query = useProducts(filters);
  const toggleSaved = useToggleSaved();
  const products = query.data?.pages.flatMap((p) => p.data) ?? [];
  const colorsAvailable = [...new Set(products.flatMap((p) => p.colors.map((c) => c.name)))].slice(0, 12);
  const activeCount = (extra.sizes?.length ?? 0) + (extra.colors?.length ?? 0) + (extra.on_sale ? 1 : 0) + (extra.in_stock ? 1 : 0);
  const toggleIn = (key: 'sizes' | 'colors', v: string) =>
    setExtra((f) => ({ ...f, [key]: f[key]?.includes(v) ? f[key]!.filter((x) => x !== v) : [...(f[key] ?? []), v] }));

  const toolbar = (
    <View>
      {header}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.gutter, marginBottom: spacing.lg }}>
        <DAOText variant="bodySmall" tone="textMuted">{query.data ? `${query.data.pages[0]?.meta.total ?? 0}` : ''}</DAOText>
        <Pressable accessibilityRole="button" onPress={() => setSheet(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Feather name="sliders" size={16} color={colors.text} />
          <DAOText variant="bodySmall">{t('shop.filters')}{activeCount ? ` (${activeCount})` : ''} · {t(`shop.sortOptions.${extra.sort ?? 'newest'}`)}</DAOText>
        </Pressable>
      </View>
    </View>
  );

  return (
    <>
      <DAOProductGrid
        products={products}
        onToggleSave={(p: ProductCard) => toggleSaved('product', p.id, p.is_saved)}
        header={toolbar}
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && void query.fetchNextPage()}
        refreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={() => void query.refetch()}
        footer={query.isFetchingNextPage ? <DAOLoadingSkeleton height={4} style={{ marginHorizontal: spacing.gutter }} /> : null}
        empty={query.isPending ? <ProductGridSkeleton /> : query.isError ? <DAOErrorState error={query.error} onRetry={() => void query.refetch()} /> : <DAOEmptyState title={t('shop.noResults')} message={t('shop.noResultsHint')} />}
      />
      <DAOBottomSheet visible={sheet} onClose={() => setSheet(false)} title={t('shop.filters')}>
        <ScrollView contentContainerStyle={{ gap: spacing.xl, paddingBottom: spacing.lg }}>
          <View style={{ gap: spacing.sm }}>
            <DAOText variant="subheading">{t('shop.sort')}</DAOText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {SORTS.map((s) => <DAOChip key={s} label={t(`shop.sortOptions.${s}`)} selected={extra.sort === s} onPress={() => setExtra((f) => ({ ...f, sort: s }))} />)}
            </View>
          </View>
          <View style={{ gap: spacing.sm }}>
            <DAOText variant="subheading">{t('shop.sizes')}</DAOText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {SIZES.map((s) => <DAOChip key={s} label={s} selected={extra.sizes?.includes(s)} onPress={() => toggleIn('sizes', s)} />)}
            </View>
          </View>
          {colorsAvailable.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              <DAOText variant="subheading">{t('shop.colors')}</DAOText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {colorsAvailable.map((c) => <DAOChip key={c} label={c} selected={extra.colors?.includes(c)} onPress={() => toggleIn('colors', c)} />)}
              </View>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <DAOChip label={t('shop.onSale')} selected={!!extra.on_sale} onPress={() => setExtra((f) => ({ ...f, on_sale: !f.on_sale }))} />
            <DAOChip label={t('shop.inStock')} selected={!!extra.in_stock} onPress={() => setExtra((f) => ({ ...f, in_stock: !f.in_stock }))} />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <DAOButton label={t('common.reset')} variant="secondary" style={{ flex: 1 }} onPress={() => setExtra({ sort: 'newest' })} />
            <DAOButton label={t('shop.showResults')} style={{ flex: 1 }} onPress={() => setSheet(false)} />
          </View>
        </ScrollView>
      </DAOBottomSheet>
    </>
  );
}
