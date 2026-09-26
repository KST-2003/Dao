import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api/errors';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import { toast } from '@/shared/store/toastStore';
import type { AddressInput } from '@/types/models';
import { useAddresses, useDeleteAddress, useSaveAddress } from '../api';

const EMPTY: AddressInput = {
  label: null, recipient_name: '', phone: '', country_code: 'TH', region: '', district: '', subdistrict: '', city: '',
  postal_code: '', address_line1: '', address_line2: '', notes: '', is_default: false,
};

/** One form for Thailand (province/district/sub-district/postcode) and Myanmar (state-region/district/township). */
export function useAddressEditScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const addresses = useAddresses();
  const existing = id ? addresses.data?.find((a) => a.id === Number(id)) : undefined;
  const [form, setForm] = useState<AddressInput>(existing ?? EMPTY);
  const save = useSaveAddress();
  const remove = useDeleteAddress();
  const message = useErrorMessage();

  const set = <K extends keyof AddressInput>(key: K) => (value: AddressInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const fieldError = (key: string) => (isApiError(save.error) ? save.error.fieldError(key) : undefined);
  const required: (keyof AddressInput)[] = ['recipient_name', 'phone', 'region', 'address_line1', ...(form.country_code === 'TH' ? (['postal_code'] as const) : [])];
  const valid = required.every((k) => String(form[k] ?? '').trim() !== '');

  return {
    isEdit: !!existing,
    form,
    set,
    valid,
    fieldError,
    labels: {
      region: t(`addresses.region.${form.country_code}`),
      subdistrict: t(`addresses.subdistrict.${form.country_code}`),
    },
    saving: save.isPending,
    submit: () =>
      save.mutate({ id: existing?.id, input: form }, { onSuccess: () => router.back(), onError: (e) => !isApiError(e, 'VALIDATION_FAILED') && toast.error(message(e)) }),
    remove: () => existing && remove.mutate(existing.id, { onSuccess: () => router.back() }),
  };
}
