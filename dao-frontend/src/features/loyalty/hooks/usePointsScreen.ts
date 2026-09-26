import { router } from 'expo-router';
import { usePoints } from '../api';

export function usePointsScreen() {
  const points = usePoints();
  const meta = points.data?.pages[0]?.meta;
  return {
    points,
    meta,
    list: points.data?.pages.flatMap((p) => p.data) ?? [],
    loadMore: () => points.hasNextPage && !points.isFetchingNextPage && void points.fetchNextPage(),
    goRewards: () => router.push('/rewards'),
  };
}
