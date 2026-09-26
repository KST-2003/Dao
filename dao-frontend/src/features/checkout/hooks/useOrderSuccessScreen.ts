import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useOrder, usePayOrder } from '@/features/orders/api';
import type { PaymentInstruction } from '@/types/models';

export function useOrderSuccessScreen() {
  const params = useLocalSearchParams<{ id: string; payment?: string }>();
  const id = Number(params.id);
  const order = useOrder(id);
  const pay = usePayOrder();
  let payment: PaymentInstruction | null = null;
  try {
    payment = params.payment ? (JSON.parse(params.payment) as PaymentInstruction) : null;
  } catch {
    payment = null;
  }

  const completePayment = () =>
    pay.mutate(id, {
      onSuccess: async (p) => {
        if (p.action === 'redirect' && p.redirect_url) {
          await WebBrowser.openAuthSessionAsync(p.redirect_url, 'dao://checkout/success');
          void order.refetch();
        }
      },
    });

  return {
    order,
    payment,
    needsPayment: order.data?.payment_status !== 'succeeded' && order.data?.payment_method === 'stripe' && order.data.status === 'pending_payment',
    completePayment,
    paying: pay.isPending,
    viewOrder: () => router.replace({ pathname: '/orders/[id]', params: { id: String(id) } }),
    continueShopping: () => router.replace('/(tabs)/shop'),
  };
}
