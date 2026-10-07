import { useState } from 'react';
import { useContentProtection } from '@/shared/hooks/useContentProtection';
import { useVideos } from '../api';

export const VLOG_CATEGORIES = ['all', 'daily_life', 'fashion', 'travel', 'beauty', 'food', 'behind_the_scenes', 'daos_life'] as const;
export type VlogCategory = (typeof VLOG_CATEGORIES)[number];

export function useVlogScreen() {
  useContentProtection('vlog');
  const [category, setCategory] = useState<VlogCategory>('all');
  const videos = useVideos(undefined, category === 'all' ? undefined : category);
  const list = videos.data?.pages.flatMap((p) => p.data).filter((v) => v.content_type !== 'recipe') ?? [];
  return {
    category,
    setCategory,
    videos,
    featured: list[0],
    rest: list.slice(1),
    loadMore: () => videos.hasNextPage && !videos.isFetchingNextPage && void videos.fetchNextPage(),
  };
}
