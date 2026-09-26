import { router } from 'expo-router';
import { useState } from 'react';
import { useMe, useSignOut } from '@/features/auth/api';
import { useMembership } from '@/features/loyalty/api';
import { useAuthStore } from '@/shared/store/authStore';

export function useMeScreen() {
  const signedIn = useAuthStore((s) => s.status) === 'authenticated';
  const me = useMe();
  const membership = useMembership();
  const signOut = useSignOut();
  const [confirmLogout, setConfirmLogout] = useState(false);

  return {
    signedIn,
    me,
    membership,
    confirmLogout,
    askLogout: () => setConfirmLogout(true),
    closeLogout: () => setConfirmLogout(false),
    logout: () => signOut.mutate(undefined, { onSettled: () => setConfirmLogout(false) }),
    loggingOut: signOut.isPending,
    go: (path: '/orders' | '/wishlist' | '/rewards' | '/addresses' | '/payment-methods' | '/language' | '/notifications' | '/settings' | '/referral' | '/membership' | '/points') =>
      router.push(path),
    goSaved: (tab: 'product' | 'video' | 'recipe') => router.push({ pathname: '/wishlist', params: { tab } }),
    signIn: () => router.push('/(auth)/login'),
    refresh: () => {
      void me.refetch();
      void membership.refetch();
    },
  };
}
