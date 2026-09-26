import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { useCategories, useCollection } from '../api';

export function useCategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const categories = useCategories();
  const category = categories.data?.flatMap((c) => [c, ...(c.children ?? [])]).find((c) => c.slug === slug);
  const base = useMemo(() => ({ category: slug }), [slug]);
  return { title: category?.name ?? '', base };
}

export function useCollectionScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const collection = useCollection(slug);
  const base = useMemo(() => ({ collection: slug }), [slug]);
  return { collection: collection.data, base };
}
