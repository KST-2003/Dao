import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import { toast } from '@/shared/store/toastStore';
import { useCancelOrder, useOrder, usePayOrder } from '../api';

export function useOrderDetailScreen() {
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const order = useOrder(id);
  const cancel = useCancelOrder();
  const pay = usePayOrder();
  const message = useErrorMessage();
  const [confirming, setConfirming] = useState(false);
  const o = order.data;

  return {
    order,
    confirming,
    askCancel: () => setConfirming(true),
    closeCancel: () => setConfirming(false),
    doCancel: () => cancel.mutate(id, { onSuccess: () => setConfirming(false), onError: (e) => toast.error(message(e)) }),
    cancelling: cancel.isPending,
    canPay: !!o && o.status === 'pending_payment' && o.payment_method === 'stripe',
    pay: () =>
      pay.mutate(id, {
        onSuccess: async (p) => {
          if (p.redirect_url) {
            await WebBrowser.openAuthSessionAsync(p.redirect_url, 'dao://checkout/success');
            void order.refetch();
          }
        },
        onError: (e) => toast.error(message(e)),
      }),
    paying: pay.isPending,
    track: () => o?.shipment?.tracking_url && void WebBrowser.openBrowserAsync(o.shipment.tracking_url),
  };
}
