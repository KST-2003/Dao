import { useState } from 'react';
import { useContentProtection } from '@/shared/hooks/useContentProtection';
import { useKitchen, useRecipes } from '../api';

export function useKitchenScreen() {
  useContentProtection('kitchen');
  const kitchen = useKitchen();
  const [category, setCategory] = useState<string | undefined>(undefined);
  const recipes = useRecipes(category);
  return {
    kitchen,
    category,
    setCategory,
    categories: kitchen.data?.categories ?? [],
    recipes,
    list: recipes.data?.pages.flatMap((p) => p.data) ?? [],
    loadMore: () => recipes.hasNextPage && !recipes.isFetchingNextPage && void recipes.fetchNextPage(),
    refresh: () => {
      void kitchen.refetch();
      void recipes.refetch();
    },
  };
}
