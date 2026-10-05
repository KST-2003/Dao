import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system/legacy';
import { api } from '@/shared/api/client';
import { qk } from '@/shared/constants/queryKeys';
import { useLocale } from '@/shared/hooks/useLocale';
import { analytics } from '@/shared/services/analytics/AnalyticsService';
import { registerForPush } from '@/shared/services/push/registerPush';
import { useAuthStore } from '@/shared/store/authStore';
import { useSavedStore } from '@/shared/store/savedStore';
import type { AppConfig, AuthPayload, User } from '@/types/models';
import type { AuthProvider } from '@/types/enums';

export function useAppConfig() {
  return useQuery({ queryKey: qk.config, queryFn: () => api.get<AppConfig>('/config'), staleTime: 10 * 60_000 });
}

export function useMe() {
  const status = useAuthStore((s) => s.status);
  return useQuery({ queryKey: qk.me, queryFn: () => api.get<User>('/me'), enabled: status === 'authenticated' });
}

/** Shared by every sign-in method: store token, seed profile cache, analytics, push. */
function useCompleteSignIn() {
  const qc = useQueryClient();
  const signIn = useAuthStore((s) => s.signIn);
  return async (payload: AuthPayload, method: AuthProvider) => {
    await signIn(payload.token, payload.is_new_user);
    qc.setQueryData(qk.me, payload.user);
    void qc.invalidateQueries();
    analytics.identify(payload.user.id);
    analytics.track(payload.is_new_user ? 'signup' : 'login', { method });
    void registerForPush().catch(() => false);
  };
}

export function useRequestOtp() {
  return useMutation({
    mutationFn: (vars: { phone: string; country: 'TH' | 'MM' }) =>
      api.post<{ phone: string; expires_in: number; resend_in: number }>('/auth/sms/request', vars),
  });
}

export function useVerifyOtp() {
  const complete = useCompleteSignIn();
  return useMutation({
    mutationFn: (vars: { phone: string; country: 'TH' | 'MM'; code: string; referral_code?: string }) =>
      api.post<AuthPayload>('/auth/sms/verify', { ...vars, device_name: 'dao-app' }),
    onSuccess: (payload) => complete(payload, 'sms'),
  });
}

export function useGoogleSignIn() {
  const complete = useCompleteSignIn();
  return useMutation({
    mutationFn: (vars: { idToken: string; referralCode?: string }) =>
      api.post<AuthPayload>('/auth/google', { id_token: vars.idToken, referral_code: vars.referralCode || undefined, device_name: 'dao-app' }),
    onSuccess: (payload) => complete(payload, 'google'),
  });
}

export function useLineSignIn() {
  const complete = useCompleteSignIn();
  return useMutation({
    mutationFn: (vars: { code: string; code_verifier: string; redirect_uri: string; referral_code?: string }) =>
      api.post<AuthPayload>('/auth/line', { ...vars, referral_code: vars.referral_code || undefined, device_name: 'dao-app' }),
    onSuccess: (payload) => complete(payload, 'line'),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const locale = useLocale();
  return useMutation({
    mutationFn: (vars: Partial<Pick<User, 'name' | 'display_name' | 'email' | 'date_of_birth' | 'gender' | 'country' | 'preferred_language'>>) =>
      api.patch<User>('/me', { preferred_language: locale, ...vars }),
    onSuccess: (user) => qc.setQueryData(qk.me, user),
  });
}

/**
 * Presign → PUT straight to R2 (never through our server) → PATCH /me with the key.
 * contentType must match exactly what was presigned (it's bound into the signature).
 */
export function useUpdateAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ uri, contentType }: { uri: string; contentType: string }) => {
      const { upload_url, key } = await api.post<{ upload_url: string; key: string }>('/me/avatar/presign', { content_type: contentType });
      const put = await FileSystem.uploadAsync(upload_url, uri, {
        httpMethod: 'PUT',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: { 'Content-Type': contentType },
      });
      if (put.status < 200 || put.status >= 300) {
        throw new Error('Upload to storage failed');
      }
      return api.patch<User>('/me', { avatar_key: key });
    },
    onSuccess: (user) => qc.setQueryData(qk.me, user),
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  const signOut = useAuthStore((s) => s.signOut);
  const clearSaved = useSavedStore((s) => s.clear);
  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout').catch(() => undefined); // server-side token revoke is best-effort
    },
    onSettled: async () => {
      await signOut();
      clearSaved();
      qc.clear();
      analytics.reset();
    },
  });
}
