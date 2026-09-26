import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import type { ProductFilters } from '@/shared/constants/queryKeys';
import { useCategories, useShopLanding } from '../api';

export function useShopScreen() {
  const categories = useCategories();
  const landing = useShopLanding();
  const [category, setCategory] = useState<string | undefined>(undefined);
  const base = useMemo<ProductFilters>(() => ({ category }), [category]);

  return {
    categories: categories.data ?? [],
    collections: landing.data?.collections ?? [],
    category,
    selectCategory: (slug?: string) => setCategory(slug),
    base,
    goSearch: () => router.push('/search'),
  };
}
