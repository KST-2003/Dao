import { router } from 'expo-router';
import { useState } from 'react';
import { useOrders, type OrdersTab } from '../api';

export const ORDER_TABS: OrdersTab[] = ['all', 'active', 'delivered', 'cancelled'];

export function useOrdersScreen() {
  const [tab, setTab] = useState<OrdersTab>('all');
  const orders = useOrders(tab);
  const list = orders.data?.pages.flatMap((p) => p.data) ?? [];
  return {
    tab,
    setTab,
    orders,
    list,
    loadMore: () => orders.hasNextPage && !orders.isFetchingNextPage && void orders.fetchNextPage(),
    open: (id: number) => router.push({ pathname: '/orders/[id]', params: { id: String(id) } }),
    explore: () => router.replace('/(tabs)/shop'),
  };
}
