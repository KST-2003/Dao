import * as Crypto from 'expo-crypto';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAddresses } from '@/features/addresses/api';
import { useProduct } from '@/features/shop/api';
import { isApiError } from '@/shared/api/errors';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import { useIsOnline } from '@/shared/hooks/useIsOnline';
import { toast } from '@/shared/store/toastStore';
import { usePreorderQuote, useSubmitPreorder } from '../api';

/** Pre-order a single size/color. Limits and totals are enforced by the server quote. */
export function usePreorderNewScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ productId: string; variantId: string }>();
  const productId = Number(params.productId);
  const variantId = Number(params.variantId);
  const product = useProduct(productId);
  const addresses = useAddresses();
  const online = useIsOnline();
  const message = useErrorMessage();
  const key = useRef(Crypto.randomUUID());
  const rule = product.data?.preorder;
  const [qty, setQty] = useState<number | null>(null);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const quantity = qty ?? rule?.min_qty ?? 1;
  const max = Math.min(rule?.max_qty ?? 99, rule?.remaining ?? 99);
  const address = addresses.data?.find((a) => a.id === addressId) ?? addresses.data?.find((a) => a.is_default) ?? addresses.data?.[0] ?? null;
  const variant = product.data?.variants.find((v) => v.id === variantId) ?? null;
  const quote = usePreorderQuote(variant ? [{ variant_id: variantId, quantity }] : []);
  const submit = useSubmitPreorder();

  const place = () => {
    if (!address) return toast.show(t('checkout.needAddress'));
    if (!quote.data) return;
    submit.mutate(
      { items: [{ variant_id: variantId, quantity }], address_id: address.id, expected_total: quote.data.total, notes: notes.trim() || undefined, idempotency_key: key.current },
      {
        onSuccess: (p) => router.replace({ pathname: '/preorders/[id]', params: { id: String(p.id) } }),
        onError: (e) => {
          if (isApiError(e, 'TOTAL_CHANGED')) void quote.refetch();
          toast.error(message(e));
        },
      },
    );
  };

  return {
    product, variant, rule, quantity, setQty, max, min: rule?.min_qty ?? 1, address, setAddressId, addresses, notes, setNotes, quote,
    quoteError: quote.error ? message(quote.error) : null, placing: submit.isPending,
    canPlace: online && !!address && !!quote.data && !quote.isFetching && !quote.error,
    place, addAddress: () => router.push({ pathname: '/addresses/edit', params: {} }),
  };
}
