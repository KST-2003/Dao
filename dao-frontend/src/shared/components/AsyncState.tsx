import type { ReactElement, ReactNode } from 'react';
import { DAOEmptyState } from './DAOEmptyState';
import { DAOErrorState } from './DAOErrorState';
import { ListSkeleton } from './DAOLoadingSkeleton';

interface Props<T> {
  query: { data: T | undefined; isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown };
  isEmpty?: (data: T) => boolean;
  empty?: { title: string; message?: string; actionLabel?: string; onAction?: () => void };
  loading?: ReactElement;
  children: (data: T) => ReactNode;
}

/** Every data screen: loading → error (retry) → empty (CTA) → content. Cached data shows while offline. */
export function AsyncState<T>({ query, isEmpty, empty, loading, children }: Props<T>) {
  if (query.data !== undefined) {
    if (isEmpty?.(query.data) && empty) {
      return <DAOEmptyState {...empty} />;
    }
    return <>{children(query.data)}</>;
  }
  if (query.isError) {
    return <DAOErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }
  return loading ?? <ListSkeleton />;
}
