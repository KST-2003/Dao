import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { qk } from '@/shared/constants/queryKeys';
import { useAuthStore } from '@/shared/store/authStore';
import type { Address, AddressInput } from '@/types/models';

export function useAddresses() {
  const status = useAuthStore((s) => s.status);
  return useQuery({ queryKey: qk.addresses, queryFn: () => api.get<Address[]>('/me/addresses'), enabled: status === 'authenticated' });
}

export function useSaveAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: AddressInput }) =>
      id ? api.put<Address>(`/me/addresses/${id}`, input) : api.post<Address>('/me/addresses', input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.addresses }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/me/addresses/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.addresses }),
  });
}
