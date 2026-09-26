import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import { useRequestOtp } from '../api';

export function usePhoneScreen() {
  const { ref } = useLocalSearchParams<{ ref?: string }>();
  const [country, setCountry] = useState<'TH' | 'MM'>('TH');
  const [phone, setPhone] = useState('');
  const request = useRequestOtp();
  const message = useErrorMessage();

  const submit = () => {
    request.mutate(
      { phone, country },
      {
        onSuccess: (res) =>
          router.push({ pathname: '/(auth)/otp', params: { phone: res.phone, country, resendIn: String(res.resend_in), ref: ref ?? '' } }),
      },
    );
  };

  return {
    country,
    setCountry,
    phone,
    setPhone,
    submit,
    loading: request.isPending,
    error: request.error ? message(request.error) : undefined,
    canSubmit: phone.replace(/\D/g, '').length >= 8,
  };
}
