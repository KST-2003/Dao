import { router } from 'expo-router';
import { useState } from 'react';
import { useAppConfig, useMe } from '@/features/auth/api';
import { queryClient } from '@/shared/api/queryClient';
import { registerForPush } from '@/shared/services/push/registerPush';
import { useAuthStore } from '@/shared/store/authStore';
import { usePrefsStore, type ThemeMode } from '@/shared/store/prefsStore';
import { toast } from '@/shared/store/toastStore';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import type { AuthProvider, Currency } from '@/types/enums';
import { useDeleteAccount, useUnlinkProvider } from '../api';

export function useSettingsScreen() {
  const signedIn = useAuthStore((s) => s.status) === 'authenticated';
  const me = useMe();
  const themeMode = usePrefsStore((s) => s.themeMode);
  const setThemeMode = usePrefsStore((s) => s.setThemeMode);
  const currency = usePrefsStore((s) => s.currency);
  const setCurrency = usePrefsStore((s) => s.setCurrency);
  const config = useAppConfig();
  const unlink = useUnlinkProvider();
  const del = useDeleteAccount();
  const message = useErrorMessage();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const providers = me.data?.providers ?? [];

  return {
    signedIn,
    themeMode,
    setTheme: (m: ThemeMode) => setThemeMode(m),
    currency,
    currencies: config.data?.currencies.options ?? (['THB', 'MMK'] as Currency[]),
    mmkPerThb: config.data?.currencies.mmk_per_thb ?? null,
    // Every cached price is in the old currency, so drop them all; screens refetch in the new one.
    chooseCurrency: (c: Currency) => {
      if (c === currency) return;
      setCurrency(c);
      void queryClient.resetQueries();
    },
    providers,
    isLinked: (p: AuthProvider) => providers.includes(p),
    unlink: (p: AuthProvider) => unlink.mutate(p, { onError: (e) => toast.error(message(e)) }),
    enablePush: async () => {
      const ok = await registerForPush().catch(() => false);
      toast.show(ok ? '✓' : '—');
    },
    confirmDelete,
    askDelete: () => setConfirmDelete(true),
    closeDelete: () => setConfirmDelete(false),
    deleting: del.isPending,
    deleteAccount: () => del.mutate(undefined, { onSuccess: () => router.replace('/(tabs)'), onError: (e) => toast.error(message(e)) }),
    goLanguage: () => router.push('/language'),
  };
}
