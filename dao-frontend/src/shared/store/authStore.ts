import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { setAuthToken } from '@/shared/api/client';
import { TOKEN_KEY } from '@/shared/constants/config';

type AuthStatus = 'booting' | 'guest' | 'authenticated';

interface AuthState {
  status: AuthStatus;
  /** Set right after sign-up so the profile-setup step is shown once. */
  isNewUser: boolean;
  hydrate: () => Promise<void>;
  signIn: (token: string, isNewUser: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  clearNewUser: () => void;
}

/** Session state. The token itself is kept in the device keychain (SecureStore), never in AsyncStorage. */
export const useAuthStore = create<AuthState>()((set) => ({
  status: 'booting',
  isNewUser: false,
  hydrate: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY).catch(() => null);
    setAuthToken(token);
    set({ status: token ? 'authenticated' : 'guest' });
  },
  signIn: async (token, isNewUser) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setAuthToken(token);
    set({ status: 'authenticated', isNewUser });
  },
  signOut: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined);
    setAuthToken(null);
    set({ status: 'guest', isNewUser: false });
  },
  clearNewUser: () => set({ isNewUser: false }),
}));
