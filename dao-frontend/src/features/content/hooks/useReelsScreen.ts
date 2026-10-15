import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { FlatList, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import type { VideoDetail } from '@/types/models';
import { recordView, useVideoCategories, useVideoFeed } from '../api';

/** TikTok-style feed: one video per screen, swipe up for the next; categories along the top. */
export function useReelsScreen() {
  const [category, setCategory] = useState<string | null>(null); // null = All
  const [index, setIndex] = useState(0);
  const [height, setHeight] = useState(0);
  const [focused, setFocused] = useState(false);
  const counted = useRef(new Set<number>());
  const listRef = useRef<FlatList<VideoDetail>>(null) as RefObject<FlatList<VideoDetail>>;
  const categories = useVideoCategories();
  const feed = useVideoFeed(category ?? undefined);
  const videos = feed.data?.pages.flatMap((p) => p.data) ?? [];
  const active = videos[index];

  // Playback only while this tab is on screen — switching tabs must silence the video.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  // A video counts as viewed once per session, when it becomes the one playing.
  useEffect(() => {
    if (focused && active && !counted.current.has(active.id)) {
      counted.current.add(active.id);
      recordView(active.id);
    }
  }, [focused, active]);

  return {
    categories: categories.data ?? [],
    category,
    pickCategory: (slug: string | null) => {
      setCategory(slug);
      setIndex(0);
    },
    feed,
    videos,
    index,
    focused,
    height,
    listRef,
    onLayout: (e: LayoutChangeEvent) => setHeight(Math.round(e.nativeEvent.layout.height)),
    onSettle: (e: NativeSyntheticEvent<NativeScrollEvent>) => height > 0 && setIndex(Math.round(e.nativeEvent.contentOffset.y / height)),
    loadMore: () => feed.hasNextPage && !feed.isFetchingNextPage && void feed.fetchNextPage(),
  };
}
