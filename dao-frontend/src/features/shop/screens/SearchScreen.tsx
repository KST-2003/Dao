import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  DAOChip, DAOCollectionCard, DAOEmptyState, DAOErrorState, DAOIconButton, DAOInput, DAOProductCard, DAORecipeCard, DAOScreen,
  DAOSectionHeader, DAOText, DAOVideoCard, ListSkeleton,
} from '@/shared/components';

import { useTheme } from '@/shared/theme';
import { useSearchScreen } from '../hooks/useSearchScreen';

export default function SearchScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { spacing } = useTheme();
  const vm = useSearchScreen();
  const r = vm.results.data;

  const header = (
    <View style={{ paddingTop: insets.top + 8, paddingHorizontal: spacing.gutter, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <DAOIconButton icon="chevron-left" tone="plain" accessibilityLabel={t('common.back')} onPress={() => router.back()} />
      <View style={{ flex: 1 }}>
        <DAOInput icon="search" value={vm.text} onChangeText={vm.setText} placeholder={t('search.placeholder')} autoFocus returnKeyType="search" onSubmitEditing={() => vm.submit()} autoCorrect={false} />
      </View>
    </View>
  );

  const rail = (title: string, children: ReactNode) => (
    <View style={{ marginTop: spacing.xl }}>
      <DAOSectionHeader title={title} />
      {children}
    </View>
  );

  return (
    <DAOScreen header={header} padded={false}>
      {!vm.query ? (
        <View style={{ padding: spacing.gutter, gap: spacing.md }}>
          {vm.recent.length ? (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <DAOText variant="subheading">{t('shop.recentlyViewed')}</DAOText>
                <Pressable onPress={vm.clearRecent}><DAOText variant="bodySmall" tone="textMuted">{t('common.clear')}</DAOText></Pressable>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{vm.recent.map((q) => <DAOChip key={q} label={q} onPress={() => vm.submit(q)} />)}</View>
            </>
          ) : null}
          <DAOText tone="textMuted">{t('search.hint')}</DAOText>
        </View>
      ) : vm.results.isError ? <DAOErrorState error={vm.results.error} onRetry={() => void vm.results.refetch()} />
        : !r ? <ListSkeleton />
        : vm.empty ? <DAOEmptyState title={t('search.noResults', { query: vm.query })} message={t('search.hint')} />
        : (
          <>
            {r.products.length ? rail(t('search.products'), (
              <FlatList horizontal data={r.products} keyExtractor={(p) => String(p.id)} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.gutter, gap: spacing.md }}
                renderItem={({ item }) => <DAOProductCard product={item} width={150} onToggleSave={(p) => vm.toggleSaved('product', p.id, p.is_saved)} />} />
            )) : null}
            {r.collections.length ? rail(t('search.collections'), (
              <FlatList horizontal data={r.collections} keyExtractor={(c) => String(c.id)} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.gutter, gap: spacing.md }}
                renderItem={({ item }) => <DAOCollectionCard collection={item} width={260} />} />
            )) : null}
            {r.recipes.length ? rail(t('search.recipes'), (
              <FlatList horizontal data={r.recipes} keyExtractor={(x) => String(x.id)} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.gutter, gap: spacing.md }}
                renderItem={({ item }) => <DAORecipeCard recipe={item} width={180} />} />
            )) : null}
            {r.videos.length ? rail(t('search.videos'), (
              <FlatList horizontal data={r.videos} keyExtractor={(v) => String(v.id)} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.gutter, gap: spacing.md }}
                renderItem={({ item }) => <DAOVideoCard video={item} width={160} />} />
            )) : null}
          </>
        )}
    </DAOScreen>
  );
}
