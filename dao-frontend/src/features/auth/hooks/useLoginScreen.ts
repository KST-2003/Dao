import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { GOOGLE_CLIENT_IDS, LINE_CHANNEL_ID } from '@/shared/constants/config';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import { toast } from '@/shared/store/toastStore';
import { useAppConfig, useGoogleSignIn, useLineSignIn } from '../api';
import type { AuthPayload } from '@/types/models';

/** Only offer methods that are configured on BOTH the app and the server — never a dead button. */
export function useLoginScreen() {
  const config = useAppConfig();
  const google = useGoogleSignIn();
  const line = useLineSignIn();
  const message = useErrorMessage();
  const [referralCode, setReferralCode] = useState('');
  const [showReferral, setShowReferral] = useState(false);

  const googleClientReady = Platform.select({ ios: GOOGLE_CLIENT_IDS.ios, android: GOOGLE_CLIENT_IDS.android, default: GOOGLE_CLIENT_IDS.web }) !== '';
  const methods = {
    google: googleClientReady && config.data?.auth.google === true,
    line: LINE_CHANNEL_ID !== '' && config.data?.auth.line === true,
    sms: config.data?.auth.sms !== false,
  };

  const afterSignIn = useCallback((payload: AuthPayload) => {
    if (payload.is_new_user || !payload.user.profile_completed) {
      router.replace('/(auth)/profile-setup');
    } else {
      router.dismissAll();
    }
  }, []);

  const onGoogleToken = useCallback(
    (idToken: string) => google.mutate({ idToken, referralCode }, { onSuccess: afterSignIn, onError: (e) => toast.error(message(e)) }),
    [google, referralCode, afterSignIn, message],
  );

  const onLineCode = useCallback(
    (vars: { code: string; code_verifier: string; redirect_uri: string }) =>
      line.mutate({ ...vars, referral_code: referralCode }, { onSuccess: afterSignIn, onError: (e) => toast.error(message(e)) }),
    [line, referralCode, afterSignIn, message],
  );

  return {
    methods,
    configLoading: config.isPending,
    googleLoading: google.isPending,
    lineLoading: line.isPending,
    onGoogleToken,
    onLineCode,
    referralCode,
    setReferralCode,
    showReferral,
    toggleReferral: () => setShowReferral((v) => !v),
    goPhone: () => router.push({ pathname: '/(auth)/phone', params: referralCode ? { ref: referralCode } : {} }),
    browseAsGuest: () => (router.canGoBack() ? router.back() : router.replace('/(tabs)')),
  };
}
