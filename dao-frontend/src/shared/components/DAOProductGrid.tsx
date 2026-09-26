import { FlatList, RefreshControl, View, type ListRenderItem } from 'react-native';
import type { ReactElement } from 'react';
import type { ProductCard } from '@/types/models';
import { useTheme } from '@/shared/theme';
import { DAOProductCard } from './DAOProductCard';

interface Props {
  products: ProductCard[];
  onToggleSave?: (p: ProductCard) => void;
  header?: ReactElement | null;
  footer?: ReactElement | null;
  empty?: ReactElement | null;
  onEndReached?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

/** Two-column, virtualized, infinite-scroll product grid. */
export function DAOProductGrid({ products, onToggleSave, header, footer, empty, onEndReached, refreshing, onRefresh }: Props) {
  const { spacing, colors } = useTheme();
  const render: ListRenderItem<ProductCard> = ({ item }) => (
    <View style={{ flex: 1, maxWidth: '50%', paddingHorizontal: spacing.sm / 2 }}>
      <DAOProductCard product={item} onToggleSave={onToggleSave} />
    </View>
  );
  return (
    <FlatList
      data={products}
      keyExtractor={(p) => String(p.id)}
      renderItem={render}
      numColumns={2}
      columnWrapperStyle={{ paddingHorizontal: spacing.gutter - spacing.sm / 2, marginBottom: spacing.xl }}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      ListEmptyComponent={empty}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.6}
      initialNumToRender={8}
      windowSize={7}
      removeClippedSubviews
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
      contentContainerStyle={{ paddingBottom: spacing.huge }}
    />
  );
}
