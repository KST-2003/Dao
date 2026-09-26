import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { onlineManager, QueryClient } from '@tanstack/react-query';
import { PERSISTED_ROOTS } from '@/shared/constants/queryKeys';
import { ApiError } from './errors';

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)),
);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false, networkMode: 'online' },
  },
});

/** Offline cache: profile, categories, home, recently viewed, and viewed product/recipe metadata. */
export const queryPersister = createAsyncStoragePersister({ storage: AsyncStorage, key: 'dao-query-cache-v1', throttleTime: 2000 });

export const persistOptions = {
  persister: queryPersister,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  buster: 'v1',
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { queryKey: readonly unknown[]; state: { status: string } }) =>
      query.state.status === 'success' && PERSISTED_ROOTS.has(String(query.queryKey[0])),
  },
};
