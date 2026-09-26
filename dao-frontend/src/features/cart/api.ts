import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { qk } from '@/shared/constants/queryKeys';
import { analytics } from '@/shared/services/analytics/AnalyticsService';
import { useAuthStore } from '@/shared/store/authStore';
import type { Cart } from '@/types/models';

export function useCart() {
  const status = useAuthStore((s) => s.status);
  return useQuery({ queryKey: qk.cart, queryFn: () => api.get<Cart>('/cart'), enabled: status === 'authenticated', networkMode: 'online' });
}

export function useCartCount(): number {
  const cart = useCart();
  return cart.data?.items.reduce((n, i) => n + i.quantity, 0) ?? 0;
}

/** Every cart mutation returns the full, server-priced cart, which replaces the cache. */
function useCartMutation<V>(fn: (vars: V) => Promise<Cart>, onDone?: (vars: V) => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (cart, vars) => {
      qc.setQueryData(qk.cart, cart);
      onDone?.(vars);
    },
  });
}

export const useAddToCart = () =>
  useCartMutation(
    (v: { variantId: number; quantity: number; productId: number }) => api.post<Cart>('/cart/items', { variant_id: v.variantId, quantity: v.quantity }),
    (v) => analytics.track('add_to_cart', { product_id: v.productId, variant_id: v.variantId, quantity: v.quantity }),
  );

export const useUpdateCartItem = () =>
  useCartMutation((v: { itemId: number; quantity: number }) => api.patch<Cart>(`/cart/items/${v.itemId}`, { quantity: v.quantity }));

export const useRemoveCartItem = () =>
  useCartMutation(
    (v: { itemId: number }) => api.delete<Cart>(`/cart/items/${v.itemId}`),
    (v) => analytics.track('remove_from_cart', { item_id: v.itemId }),
  );

export const useSaveForLater = () =>
  useCartMutation((v: { itemId: number; saved: boolean }) => api.post<Cart>(`/cart/items/${v.itemId}/save-for-later`, { saved: v.saved }));

export const useAcceptPrice = () => useCartMutation((v: { itemId: number }) => api.post<Cart>(`/cart/items/${v.itemId}/accept-price`));

export const useApplyCartOptions = () =>
  useCartMutation((v: { coupon_code: string | null; points: number }) => api.put<Cart>('/cart/options', v));
