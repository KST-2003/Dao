import { router } from 'expo-router';
import { useState } from 'react';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import { analytics } from '@/shared/services/analytics/AnalyticsService';
import { useAuthStore } from '@/shared/store/authStore';
import { toast } from '@/shared/store/toastStore';
import { useAcceptPrice, useApplyCartOptions, useCart, useRemoveCartItem, useSaveForLater, useUpdateCartItem } from '../api';

export function useCartScreen() {
  const signedIn = useAuthStore((s) => s.status) === 'authenticated';
  const cart = useCart();
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const saveForLater = useSaveForLater();
  const acceptPrice = useAcceptPrice();
  const applyOptions = useApplyCartOptions();
  const message = useErrorMessage();
  const [promo, setPromo] = useState('');
  const onError = (e: unknown) => toast.error(message(e));
  const busy = update.isPending || remove.isPending || saveForLater.isPending;

  const quote = cart.data?.quote;
  const toFreeShipping = quote && quote.free_shipping_threshold > 0 ? Math.max(0, quote.free_shipping_threshold - (quote.subtotal - quote.member_discount - quote.coupon_discount)) : null;

  return {
    signedIn,
    cart,
    busy,
    issueFor: (itemId: number) => cart.data?.issues.find((i) => i.item_id === itemId),
    setQuantity: (itemId: number, quantity: number) => update.mutate({ itemId, quantity }, { onError }),
    remove: (itemId: number) => remove.mutate({ itemId }, { onError }),
    saveForLater: (itemId: number, saved: boolean) => saveForLater.mutate({ itemId, saved }, { onError }),
    acceptPrice: (itemId: number) => acceptPrice.mutate({ itemId }, { onError }),
    promo,
    setPromo,
    applyPromo: () => applyOptions.mutate({ coupon_code: promo.trim() || null, points: cart.data?.points_to_redeem ?? 0 }, { onError, onSuccess: () => setPromo('') }),
    removePromo: () => applyOptions.mutate({ coupon_code: null, points: cart.data?.points_to_redeem ?? 0 }, { onError }),
    applying: applyOptions.isPending,
    toFreeShipping,
    checkout: () => {
      analytics.track('checkout_started', { total: quote?.total ?? 0 });
      router.push('/checkout');
    },
    signIn: () => router.push('/(auth)/login'),
    explore: () => router.replace('/(tabs)/shop'),
  };
}
