import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api/errors';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import { useIsOnline } from '@/shared/hooks/useIsOnline';
import { toast } from '@/shared/store/toastStore';
import type { PlaceOrderResult } from '@/types/models';
import { usePlaceOrder, useQuote } from '../api';
import { useCheckoutForm } from './useCheckoutForm';

export function useCheckoutScreen() {
  const { t } = useTranslation();
  const form = useCheckoutForm();
  const online = useIsOnline();
  const message = useErrorMessage();
  const idempotencyKey = useRef(Crypto.randomUUID());
  const quote = useQuote({ coupon_code: form.coupon, points: form.points, delivery_method: form.delivery });
  const place = usePlaceOrder();

  const goToResult = async (result: PlaceOrderResult) => {
    const { order, payment } = result;
    if (payment.action === 'redirect' && payment.redirect_url) {
      await WebBrowser.openAuthSessionAsync(payment.redirect_url, 'dao://checkout/success');
    }
    router.replace({ pathname: '/order-success/[id]', params: { id: String(order.id), payment: JSON.stringify(payment) } });
  };

  const submit = () => {
    if (!form.address) {
      toast.show(t('checkout.needAddress'));
      return;
    }
    if (!quote.data || !form.payment) {
      return;
    }
    place.mutate(
      {
        address_id: form.address.id, delivery_method: form.delivery, payment_method: form.payment,
        coupon_code: form.coupon, points: form.points, expected_total: quote.data.total,
        notes: form.notes.trim() || undefined, idempotency_key: idempotencyKey.current,
      },
      {
        onSuccess: (result) => void goToResult(result),
        onError: (e) => {
          if (isApiError(e, 'TOTAL_CHANGED')) {
            toast.show(t('checkout.totalChanged'));
            void quote.refetch();
          } else if (isApiError(e, 'CART_INVALID')) {
            toast.error(message(e));
            router.replace('/cart');
          } else {
            toast.error(message(e));
          }
        },
      },
    );
  };

  return {
    ...form,
    quote,
    quoteError: quote.error ? message(quote.error) : null,
    placing: place.isPending,
    canPlace: online && !!form.address && !!form.payment && !!quote.data && !quote.isFetching && !quote.error,
    online,
    submit,
    addAddress: () => router.push({ pathname: '/addresses/edit', params: {} }),
  };
}
