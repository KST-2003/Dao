import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { useCheckoutOptions } from '@/features/checkout/api';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import { toast } from '@/shared/store/toastStore';
import type { PaymentMethod } from '@/types/enums';
import type { PaymentInstruction } from '@/types/models';
import { useCancelPreorder, usePayPreorder, usePreorder } from '../api';

export function usePreorderDetailScreen() {
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const preorder = usePreorder(id);
  const cancel = useCancelPreorder();
  const pay = usePayPreorder();
  const options = useCheckoutOptions(null);
  const message = useErrorMessage();
  const [confirming, setConfirming] = useState(false);
  const [picked, setPicked] = useState<PaymentMethod | null>(null);
  const [instructions, setInstructions] = useState<PaymentInstruction | null>(null);

  // COD makes no sense before the goods exist; the server rejects it too.
  const methods = (options.data?.payment_methods ?? []).filter((m) => m !== 'cod');
  const method = picked ?? methods[0] ?? null;

  const payNow = () => {
    if (!method) return;
    pay.mutate(
      { id, method },
      {
        onSuccess: async (p) => {
          if (p.action === 'redirect' && p.redirect_url) {
            await WebBrowser.openAuthSessionAsync(p.redirect_url, 'dao://checkout/success');
            void preorder.refetch();
          } else {
            setInstructions(p);
          }
        },
        onError: (e) => toast.error(message(e)),
      },
    );
  };

  return {
    preorder,
    confirming,
    askCancel: () => setConfirming(true),
    closeCancel: () => setConfirming(false),
    doCancel: () => cancel.mutate(id, { onSuccess: () => setConfirming(false), onError: (e) => toast.error(message(e)) }),
    cancelling: cancel.isPending,
    methods,
    method,
    pickMethod: setPicked,
    payNow,
    paying: pay.isPending,
    bank: instructions?.action === 'bank_transfer' ? instructions.instructions : null,
  };
}
