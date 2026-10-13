import { router } from 'expo-router';
import { useState } from 'react';
import { usePreorders, type PreordersTab } from '../api';

export const PREORDER_TABS: PreordersTab[] = ['all', 'active', 'completed', 'closed'];

export function usePreordersScreen() {
  const [tab, setTab] = useState<PreordersTab>('all');
  const preorders = usePreorders(tab);
  const list = preorders.data?.pages.flatMap((p) => p.data) ?? [];
  return {
    tab,
    setTab,
    preorders,
    list,
    loadMore: () => preorders.hasNextPage && !preorders.isFetchingNextPage && void preorders.fetchNextPage(),
    open: (id: number) => router.push({ pathname: '/preorders/[id]', params: { id: String(id) } }),
    explore: () => router.replace('/(tabs)/shop'),
  };
}
