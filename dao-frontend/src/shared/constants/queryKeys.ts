import type { ProductSort, SaveableType } from '@/types/enums';

/** Central query keys. Persisted (offline) keys are listed in PERSISTED_ROOTS. */
export const qk = {
  config: ['config'] as const,
  me: ['me'] as const,
  home: (locale: string) => ['home', locale] as const,
  categories: (locale: string) => ['categories', locale] as const,
  shopLanding: (locale: string) => ['shop', locale] as const,
  products: (filters: ProductFilters, locale: string) => ['products', locale, filters] as const,
  product: (id: number, locale: string) => ['product', id, locale] as const,
  related: (id: number) => ['product', id, 'related'] as const,
  reviews: (id: number) => ['product', id, 'reviews'] as const,
  recentlyViewed: ['recentlyViewed'] as const,
  collection: (slug: string, locale: string) => ['collection', slug, locale] as const,
  search: (q: string, locale: string) => ['search', locale, q] as const,
  cart: ['cart'] as const,
  checkoutOptions: ['checkoutOptions'] as const,
  quote: (params: object) => ['quote', params] as const,
  addresses: ['addresses'] as const,
  orders: (tab: string) => ['orders', tab] as const,
  order: (id: number) => ['order', id] as const,
  videos: (type: string | undefined, category: string | undefined, locale: string) => ['videos', locale, type, category] as const,
  video: (id: number, locale: string) => ['video', id, locale] as const,
  videoRelated: (id: number) => ['video', id, 'related'] as const,
  comments: (id: number) => ['video', id, 'comments'] as const,
  kitchen: (locale: string) => ['kitchen', locale] as const,
  recipes: (category: string | undefined, locale: string) => ['recipes', locale, category] as const,
  recipe: (id: number, locale: string) => ['recipe', id, locale] as const,
  saved: (type: SaveableType) => ['saved', type] as const,
  points: ['points'] as const,
  membership: ['membership'] as const,
  rewards: ['rewards'] as const,
  coupons: ['coupons'] as const,
  referral: ['referral'] as const,
  notifications: ['notifications'] as const,
};

export const PERSISTED_ROOTS = new Set(['config', 'me', 'home', 'categories', 'recentlyViewed', 'product', 'recipe', 'membership']);

export interface ProductFilters {
  category?: string;
  collection?: string;
  q?: string;
  sizes?: string[];
  colors?: string[];
  on_sale?: boolean;
  in_stock?: boolean;
  sort?: ProductSort;
}
