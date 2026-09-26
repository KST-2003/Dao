import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { qk } from '@/shared/constants/queryKeys';
import { useAuthStore } from '@/shared/store/authStore';
import type { Order, Paginated, PaymentInstruction } from '@/types/models';

export type OrdersTab = 'all' | 'active' | 'delivered' | 'cancelled';

export function useOrders(tab: OrdersTab) {
  const status = useAuthStore((s) => s.status);
  return useInfiniteQuery({
    queryKey: qk.orders(tab),
    enabled: status === 'authenticated',
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.getRaw<Paginated<Order>>('/orders', { params: { tab, page: pageParam } }),
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
  });
}

export function useOrder(id: number) {
  return useQuery({ queryKey: qk.order(id), queryFn: () => api.get<Order>(`/orders/${id}`) });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post<Order>(`/orders/${id}/cancel`),
    onSuccess: (order) => {
      qc.setQueryData(qk.order(order.id), order);
      void qc.invalidateQueries({ queryKey: ['orders'] });
      void qc.invalidateQueries({ queryKey: qk.points });
    },
  });
}

export function usePayOrder() {
  return useMutation({ mutationFn: (id: number) => api.post<PaymentInstruction>(`/orders/${id}/pay`) });
}
