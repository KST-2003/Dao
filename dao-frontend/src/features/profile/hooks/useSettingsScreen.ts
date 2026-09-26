import { router } from 'expo-router';
import { useState } from 'react';
import { useMe } from '@/features/auth/api';
import { registerForPush } from '@/shared/services/push/registerPush';
import { useAuthStore } from '@/shared/store/authStore';
import { usePrefsStore, type ThemeMode } from '@/shared/store/prefsStore';
import { toast } from '@/shared/store/toastStore';
import { useErrorMessage } from '@/shared/hooks/useErrorMessage';
import type { AuthProvider } from '@/types/enums';
import { useDeleteAccount, useUnlinkProvider } from '../api';

export function useSettingsScreen() {
  const signedIn = useAuthStore((s) => s.status) === 'authenticated';
  const me = useMe();
  const themeMode = usePrefsStore((s) => s.themeMode);
  const setThemeMode = usePrefsStore((s) => s.setThemeMode);
  const unlink = useUnlinkProvider();
  const del = useDeleteAccount();
  const message = useErrorMessage();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const providers = me.data?.providers ?? [];

  return {
    signedIn,
    themeMode,
    setTheme: (m: ThemeMode) => setThemeMode(m),
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
