import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { qk } from '@/shared/constants/queryKeys';
import { useLocale } from '@/shared/hooks/useLocale';
import { analytics } from '@/shared/services/analytics/AnalyticsService';
import type { KitchenFeed, Paginated, RecipeCard, RecipeDetail } from '@/types/models';

export function useKitchen() {
  const locale = useLocale();
  return useQuery({ queryKey: qk.kitchen(locale), queryFn: () => api.get<KitchenFeed>('/kitchen') });
}

export function useRecipes(category?: string) {
  const locale = useLocale();
  return useInfiniteQuery({
    queryKey: qk.recipes(category, locale),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.getRaw<Paginated<RecipeCard>>('/recipes', { params: { category, page: pageParam } }),
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
  });
}

export function useRecipe(id: number) {
  const locale = useLocale();
  return useQuery({
    queryKey: qk.recipe(id, locale),
    queryFn: async () => {
      analytics.track('recipe_view', { recipe_id: id });
      return api.get<RecipeDetail>(`/recipes/${id}`);
    },
  });
}
