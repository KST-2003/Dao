import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { qk, type ProductFilters } from '@/shared/constants/queryKeys';
import { useLocale } from '@/shared/hooks/useLocale';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { analytics } from '@/shared/services/analytics/AnalyticsService';
import { useAuthStore } from '@/shared/store/authStore';
import { useSavedStore } from '@/shared/store/savedStore';
import { toast } from '@/shared/store/toastStore';
import type { SaveableType } from '@/types/enums';
import type {
  Banner, Category, Collection, HomeFeed, Paginated, ProductCard, ProductDetail, Review, SearchResults,
} from '@/types/models';

export function useHome() {
  const locale = useLocale();
  const status = useAuthStore((s) => s.status);
  return useQuery({ queryKey: [...qk.home(locale), status], queryFn: () => api.get<HomeFeed>('/home') });
}

export function useCategories() {
  const locale = useLocale();
  return useQuery({ queryKey: qk.categories(locale), queryFn: () => api.get<Category[]>('/categories'), staleTime: 30 * 60_000 });
}

export function useShopLanding() {
  const locale = useLocale();
  return useQuery({ queryKey: qk.shopLanding(locale), queryFn: () => api.get<{ banners: Banner[]; collections: Collection[] }>('/shop') });
}

function toParams(f: ProductFilters, page: number) {
  return {
    page,
    per_page: 20,
    category: f.category,
    collection: f.collection,
    q: f.q,
    sort: f.sort,
    sizes: f.sizes,
    colors: f.colors,
    on_sale: f.on_sale ? 1 : undefined,
    in_stock: f.in_stock ? 1 : undefined,
  };
}

/** Infinite, paginated product listing — never the whole catalog. */
export function useProducts(filters: ProductFilters) {
  const locale = useLocale();
  return useInfiniteQuery({
    queryKey: qk.products(filters, locale),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.getRaw<Paginated<ProductCard>>('/products', { params: toParams(filters, pageParam) }),
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(id: number) {
  const locale = useLocale();
  return useQuery({
    queryKey: qk.product(id, locale),
    queryFn: async () => {
      const product = await api.get<ProductDetail>(`/products/${id}`);
      analytics.track('product_view', { product_id: id });
      return product;
    },
  });
}

export function useRelatedProducts(id: number) {
  return useQuery({ queryKey: qk.related(id), queryFn: () => api.get<ProductCard[]>(`/products/${id}/related`) });
}

export function useReviews(id: number) {
  return useQuery({
    queryKey: qk.reviews(id),
    queryFn: () => api.getRaw<Paginated<Review, { rating_avg: number; rating_count: number; distribution: Record<string, number> }>>(`/products/${id}/reviews`),
  });
}

export function useCollection(slug: string) {
  const locale = useLocale();
  return useQuery({ queryKey: qk.collection(slug, locale), queryFn: () => api.get<Collection>(`/collections/${slug}`) });
}

export function useRecentlyViewed() {
  const status = useAuthStore((s) => s.status);
  return useQuery({ queryKey: qk.recentlyViewed, queryFn: () => api.get<ProductCard[]>('/me/recently-viewed'), enabled: status === 'authenticated' });
}

export function useSearch(q: string) {
  const locale = useLocale();
  return useQuery({
    queryKey: qk.search(q, locale),
    queryFn: async () => {
      analytics.track('product_search', { q });
      return api.get<SearchResults>('/search', { params: { q } });
    },
    enabled: q.trim().length >= 1,
    placeholderData: keepPreviousData,
  });
}

/** Optimistic save/unsave for products, videos and recipes (unified wishlist). */
export function useToggleSaved() {
  const qc = useQueryClient();
  const setOverride = useSavedStore((s) => s.set);
  const requireAuth = useRequireAuth();
  const mutation = useMutation({
    mutationFn: ({ type, id, saved }: { type: SaveableType; id: number; saved: boolean }) =>
      saved ? api.post('/me/saved', { type, id }) : api.delete(`/me/saved/${type}/${id}`),
    onMutate: ({ type, id, saved }) => {
      setOverride(type, id, saved);
      if (saved) {
        analytics.track('wishlist_add', { type, id });
      }
    },
    onError: (_e, { type, id, saved }) => {
      setOverride(type, id, !saved);
      toast.error('✕');
    },
    onSettled: (_d, _e, { type }) => void qc.invalidateQueries({ queryKey: qk.saved(type) }),
  });
  return requireAuth((type: SaveableType, id: number, currentlySaved: boolean) => mutation.mutate({ type, id, saved: !currentlySaved }));
}
