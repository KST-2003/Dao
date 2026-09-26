import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { qk } from '@/shared/constants/queryKeys';
import { analytics } from '@/shared/services/analytics/AnalyticsService';
import type { DeliveryMethod, PaymentMethod } from '@/types/enums';
import type { CheckoutOptions, PlaceOrderResult, Quote } from '@/types/models';

export function useCheckoutOptions() {
  return useQuery({ queryKey: qk.checkoutOptions, queryFn: () => api.get<CheckoutOptions>('/checkout/options'), networkMode: 'online' });
}

export interface QuoteParams {
  coupon_code: string | null;
  points: number;
  delivery_method: DeliveryMethod;
}

/** Authoritative server quote — the app never calculates totals itself. */
export function useQuote(params: QuoteParams) {
  return useQuery({
    queryKey: qk.quote(params),
    queryFn: () => api.post<Quote>('/checkout/quote', params),
    placeholderData: keepPreviousData,
    networkMode: 'online',
    retry: false,
  });
}

export interface PlaceOrderInput extends QuoteParams {
  address_id: number;
  payment_method: PaymentMethod;
  expected_total: number;
  notes?: string;
  idempotency_key: string;
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ points, ...rest }: PlaceOrderInput) => api.post<PlaceOrderResult>('/orders', { ...rest, points_to_redeem: points }),
    networkMode: 'online', // no offline checkout
    onSuccess: (result, input) => {
      analytics.track('purchase_completed', { order_id: result.order.id, total: result.order.grand_total, payment: input.payment_method });
      if (input.coupon_code) analytics.track('coupon_used', { code: input.coupon_code });
      if (input.points > 0) analytics.track('points_redeemed', { points: input.points });
      void qc.invalidateQueries({ queryKey: qk.cart });
      void qc.invalidateQueries({ queryKey: ['orders'] });
      void qc.invalidateQueries({ queryKey: qk.points });
      void qc.invalidateQueries({ queryKey: qk.membership });
      qc.setQueryData(qk.order(result.order.id), result.order);
    },
  });
}
