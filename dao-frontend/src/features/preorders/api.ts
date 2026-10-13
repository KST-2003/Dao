import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { qk } from '@/shared/constants/queryKeys';
import { useAuthStore } from '@/shared/store/authStore';
import type { PaymentMethod } from '@/types/enums';
import type { Paginated, PaymentInstruction, Preorder, PreorderQuote } from '@/types/models';

export type PreordersTab = 'all' | 'active' | 'completed' | 'closed';

export interface PreorderLine {
  variant_id: number;
  quantity: number;
}

export function usePreorders(tab: PreordersTab) {
  const status = useAuthStore((s) => s.status);
  return useInfiniteQuery({
    queryKey: qk.preorders(tab),
    enabled: status === 'authenticated',
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.getRaw<Paginated<Preorder>>('/preorders', { params: { tab, page: pageParam } }),
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
  });
}

export function usePreorder(id: number) {
  return useQuery({ queryKey: qk.preorder(id), queryFn: () => api.get<Preorder>(`/preorders/${id}`) });
}

/** Authoritative estimate (limits are validated server-side) — the app never calculates totals itself. */
export function usePreorderQuote(items: PreorderLine[]) {
  return useQuery({
    queryKey: qk.preorderQuote(items),
    queryFn: () => api.post<PreorderQuote>('/preorders/quote', { items }),
    enabled: items.length > 0,
    placeholderData: keepPreviousData,
    networkMode: 'online',
    retry: false,
  });
}

export interface SubmitPreorderInput {
  items: PreorderLine[];
  address_id: number;
  expected_total: number;
  notes?: string;
  idempotency_key: string;
}

export function useSubmitPreorder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitPreorderInput) => api.post<Preorder>('/preorders', input),
    networkMode: 'online',
    onSuccess: (preorder) => {
      qc.setQueryData(qk.preorder(preorder.id), preorder);
      void qc.invalidateQueries({ queryKey: ['preorders'] });
    },
  });
}

export function useCancelPreorder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post<Preorder>(`/preorders/${id}/cancel`),
    onSuccess: (preorder) => {
      qc.setQueryData(qk.preorder(preorder.id), preorder);
      void qc.invalidateQueries({ queryKey: ['preorders'] });
    },
  });
}

export function usePayPreorder() {
  return useMutation({
    mutationFn: ({ id, method }: { id: number; method: PaymentMethod }) =>
      api.post<PaymentInstruction>(`/preorders/${id}/pay`, { payment_method: method }),
  });
}
