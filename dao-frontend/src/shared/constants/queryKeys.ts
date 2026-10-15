import { usePrefsStore } from '@/shared/store/prefsStore';
import type { ProductSort, SaveableType } from '@/types/enums';

/** Prices come back in the customer's currency, so anything cached with prices is keyed by it. */
const cur = () => usePrefsStore.getState().currency;

/** Central query keys. Persisted (offline) keys are listed in PERSISTED_ROOTS. */
export const qk = {
  config: ['config'] as const,
  me: ['me'] as const,
  home: (locale: string) => ['home', locale, cur()] as const,
  categories: (locale: string) => ['categories', locale] as const,
  shopLanding: (locale: string) => ['shop', locale, cur()] as const,
  products: (filters: ProductFilters, locale: string) => ['products', locale, cur(), filters] as const,
  product: (id: number, locale: string) => ['product', id, locale, cur()] as const,
  related: (id: number) => ['product', id, 'related'] as const,
  reviews: (id: number) => ['product', id, 'reviews'] as const,
  recentlyViewed: ['recentlyViewed'] as const,
  collection: (slug: string, locale: string) => ['collection', slug, locale, cur()] as const,
  search: (q: string, locale: string) => ['search', locale, cur(), q] as const,
  cart: ['cart'] as const,
  /** Delivery methods depend on the address's country; payment methods on the currency. */
  checkoutOptions: (addressId: number | null) => ['checkoutOptions', addressId, cur()] as const,
  quote: (params: object) => ['quote', params] as const,
  addresses: ['addresses'] as const,
  orders: (tab: string) => ['orders', tab] as const,
  order: (id: number) => ['order', id] as const,
  preorders: (tab: string) => ['preorders', tab] as const,
  preorder: (id: number) => ['preorder', id] as const,
  preorderQuote: (items: object) => ['preorderQuote', items] as const,
  videos: (type: string | undefined, category: string | undefined, locale: string) => ['videos', locale, type, category] as const,
  video: (id: number, locale: string) => ['video', id, locale] as const,
  videoFeed: (category: string | undefined, locale: string) => ['videoFeed', locale, category] as const,
  videoCategories: (locale: string) => ['videoCategories', locale] as const,
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
