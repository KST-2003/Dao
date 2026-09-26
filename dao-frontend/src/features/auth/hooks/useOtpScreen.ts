import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { isApiError } from '@/shared/api/errors';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import { useRequestOtp, useVerifyOtp } from '../api';

export function useOtpScreen() {
  const params = useLocalSearchParams<{ phone: string; country: 'TH' | 'MM'; resendIn?: string; ref?: string }>();
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(Number(params.resendIn ?? 60));
  const verify = useVerifyOtp();
  const resend = useRequestOtp();
  const message = useErrorMessage();

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const submit = (value = code) => {
    if (value.length !== 6 || verify.isPending) {
      return;
    }
    verify.mutate(
      { phone: params.phone, country: params.country, code: value, referral_code: params.ref || undefined },
      {
        onSuccess: (payload) => {
          if (payload.is_new_user || !payload.user.profile_completed) {
            router.replace('/(auth)/profile-setup');
          } else {
            router.dismissAll();
          }
        },
        onError: () => setCode(''),
      },
    );
  };

  const onChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (digits.length === 6) {
      submit(digits);
    }
  };

  const doResend = () =>
    resend.mutate({ phone: params.phone, country: params.country }, { onSuccess: (r) => setCooldown(r.resend_in) });

  const attemptsLeft = isApiError(verify.error, 'OTP_INVALID') ? Number(verify.error.errors.attempts_remaining ?? 0) : null;

  return {
    phone: params.phone,
    code,
    onChange,
    submit: () => submit(),
    cooldown,
    resend: doResend,
    resending: resend.isPending,
    verifying: verify.isPending,
    error: verify.error ? message(verify.error) : resend.error ? message(resend.error) : undefined,
    attemptsLeft,
  };
}
