import { router } from 'expo-router';
import { useCallback } from 'react';
import { useAuthStore } from '@/shared/store/authStore';

/** Wraps an action that needs a signed-in customer; guests are sent to sign in. */
export function useRequireAuth() {
  const status = useAuthStore((s) => s.status);
  return useCallback(
    <A extends unknown[]>(action: (...args: A) => void) =>
      (...args: A) => {
        if (status !== 'authenticated') {
          router.push('/(auth)/login');
          return;
        }
        action(...args);
      },
    [status],
  );
}
