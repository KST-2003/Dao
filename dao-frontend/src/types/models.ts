/**
 * API models — mirror dao-backend app/Http/Resources/Api/*. Keep in sync.
 * All money values are integers in minor units (satang).
 */
import type {
  AuthProvider, CartIssueCode, ContentType, CouponType, DeliveryMethod, Difficulty, Gender,
  LoyaltyTransactionType, NotificationType, OrderStatus, PaymentAction, PaymentMethod, PaymentStatus,
  ProductBadge, RewardType, ShipmentStatus,
} from './enums';

export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface Paginated<T, M = Record<string, never>> {
  data: T[];
  meta: PaginationMeta & M;
}

export interface User {
  id: number;
  name: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  preferred_language: string;
  country: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  referral_code: string;
  profile_completed: boolean;
  providers?: AuthProvider[];
  created_at: string | null;
}

export interface AuthPayload {
  token: string;
  is_new_user: boolean;
  user: User;
}

export interface AppConfig {
  locales: string[];
  fallback_locale: string;
  currency: string;
  auth: { google: boolean; line: boolean; sms: boolean };
  payment_methods: PaymentMethod[];
  loyalty: { redeem_points_unit: number; redeem_value_per_unit: number; redeem_min_points: number; redeem_max_percent: number };
  shipping: { standard_fee: number; express_fee: number; free_threshold: number };
}

export interface Address {
  id: number;
  label: string | null;
  recipient_name: string;
  phone: string;
  country_code: 'TH' | 'MM';
  region: string | null;
  district: string | null;
  subdistrict: string | null;
  city: string | null;
  postal_code: string | null;
  address_line1: string;
  address_line2: string | null;
  notes: string | null;
  is_default: boolean;
}

export type AddressInput = Omit<Address, 'id' | 'is_default'> & { is_default?: boolean };

export interface Category {
  id: number;
  slug: string;
  name: string | null;
  description: string | null;
  image_url: string | null;
  children?: Category[];
}

export interface ProductCard {
  id: number;
  slug: string;
  name: string | null;
  brand: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  currency: string;
  price: number;
  sale_price: number | null;
  discount_percent: number | null;
  member_price: number | null;
  badges: ProductBadge[];
  is_vip_only: boolean;
  rating_avg: number;
  rating_count: number;
  in_stock: boolean;
  colors: { name: string; hex: string | null }[];
  is_saved: boolean;
}

export interface ProductVariant {
  id: number;
  sku: string;
  size: string | null;
  color: string | null;
  color_hex: string | null;
  price: number;
  list_price: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  stock_left: number | null;
  attributes: Record<string, string>;
}

export interface ProductDetail extends ProductCard {
  description: string | null;
  materials: string | null;
  care_instructions: string | null;
  shipping_info: string | null;
  video_url: string | null;
  external_url: string | null;
  category: { slug: string; name: string | null } | null;
  images: { id: number; url: string; thumbnail_url: string | null; alt: string | null; color: string | null }[];
  variants: ProductVariant[];
  sizes: string[];
  pricing: { your_price: number; tier: string | null; is_member_price: boolean } | null;
}

export interface Review {
  id: number;
  rating: number;
  body: string | null;
  photos: string[];
  is_verified_purchase: boolean;
  status: string;
  user: { name: string; avatar_url: string | null };
  created_at: string | null;
}

export interface Collection {
  id: number;
  slug: string;
  name: string | null;
  subtitle: string | null;
  description: string | null;
  hero_image_url: string | null;
  is_vip_only: boolean;
  ends_at: string | null;
  products?: ProductCard[];
}

export interface Banner {
  id: number;
  image_url: string;
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
  cta_label: string | null;
  link: { type: 'product' | 'collection' | 'category' | 'video' | 'recipe' | 'url'; value: string } | null;
  theme: 'botanical' | 'midnight';
}

export interface MembershipTier {
  id: number;
  code: string;
  name: string | null;
  description: string | null;
  benefits: string[];
  min_points: number;
  min_spend: number;
  discount_percent: number;
  points_multiplier: number;
  free_shipping: boolean;
  early_access: boolean;
  badge_icon: string | null;
  color: string | null;
  sort_order: number;
}

export interface HomeFeed {
  greeting: { key: string; params: Record<string, string | number>; order_id?: number };
  hero: Banner[];
  new_arrivals: ProductCard[];
  dao_picks: ProductCard[];
  featured_collection: Collection | null;
  feature_banners: Banner[];
  from_dao: VideoCard[];
  kitchen: RecipeCard[];
  membership: {
    tier: MembershipTier;
    balance: number;
    points_to_next: number | null;
    next_tier: string | null;
    progress: number;
  } | null;
}

export interface Quote {
  currency: string;
  subtotal: number;
  member_discount: number;
  coupon_code: string | null;
  coupon_discount: number;
  points_redeemed: number;
  points_discount: number;
  delivery_method: DeliveryMethod;
  shipping_fee: number;
  free_shipping_threshold: number;
  total: number;
  points_to_earn: number;
}

export interface CartItem {
  id: number;
  variant_id: number;
  product_id: number | null;
  name: string | null;
  image_url: string | null;
  size: string | null;
  color: string | null;
  variant_label: string | null;
  quantity: number;
  unit_price: number | null;
  member_unit_price: number | null;
  line_total: number | null;
  max_quantity: number;
  saved_for_later: boolean;
}

export interface CartIssue {
  item_id: number;
  code: CartIssueCode;
  available?: number;
  old_price?: number;
  new_price?: number;
}

export interface Cart {
  items: CartItem[];
  saved_for_later: CartItem[];
  issues: CartIssue[];
  coupon_code: string | null;
  points_to_redeem: number;
  option_error: { code: string; message: string } | null;
  quote: Quote;
  can_checkout: boolean;
}

export interface CheckoutOptions {
  payment_methods: PaymentMethod[];
  delivery_methods: { code: DeliveryMethod; fee: number }[];
}

export interface PaymentInstruction {
  action: PaymentAction;
  redirect_url: string | null;
  instructions: {
    bank_name?: string | null;
    account_name?: string | null;
    account_number?: string | null;
    promptpay_id?: string | null;
    amount?: number;
    currency?: string;
    reference?: string;
  };
}

export interface OrderItem {
  id: number;
  product_id: number | null;
  variant_id: number | null;
  name: string;
  variant_label: string | null;
  image_url: string | null;
  unit_price: number;
  original_unit_price: number;
  quantity: number;
  line_total: number;
}

export interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  delivery_method: DeliveryMethod;
  currency: string;
  subtotal: number;
  member_discount: number;
  coupon_code: string | null;
  coupon_discount: number;
  points_redeemed: number;
  points_discount: number;
  points_earned: number;
  shipping_fee: number;
  grand_total: number;
  item_count?: number;
  items?: OrderItem[];
  shipping_address: Omit<Address, 'id' | 'is_default' | 'label'>;
  shipment?: {
    carrier: string | null;
    tracking_number: string | null;
    tracking_url: string | null;
    status: ShipmentStatus;
    shipped_at: string | null;
    delivered_at: string | null;
  } | null;
  timeline?: { status: OrderStatus; at: string | null }[];
  can_cancel: boolean;
  notes: string | null;
  placed_at: string | null;
  paid_at: string | null;
}

export interface PlaceOrderResult {
  order: Order;
  payment: PaymentInstruction;
}

export interface LoyaltyTransaction {
  id: number;
  type: LoyaltyTransactionType;
  points: number;
  balance_after: number;
  description: string | null;
  reference: { type: string; id: number } | null;
  expires_at?: string | null;
  created_at: string | null;
}

export interface PointsMeta {
  balance: number;
  lifetime_points: number;
  expiring_within_30_days: number;
  redeem: { points_unit: number; value_per_unit: number; min_points: number };
}

export interface MembershipSummary {
  tier: MembershipTier;
  next_tier: MembershipTier | null;
  balance: number;
  lifetime_points: number;
  lifetime_spend: number;
  points_to_next: number | null;
  spend_to_next: number | null;
  progress: number;
  member_since: string | null;
  tiers: MembershipTier[];
}

export interface Reward {
  id: number;
  code: string;
  type: RewardType;
  name: string | null;
  description: string | null;
  points_cost: number;
  value: number;
  value_type: 'fixed' | 'percent';
  min_subtotal: number;
  image_url: string | null;
  min_tier: string | null;
  stock: number | null;
  ends_at: string | null;
}

export interface Coupon {
  id: number;
  code: string;
  type: CouponType;
  value: number;
  max_discount: number | null;
  min_subtotal: number;
  description: string | null;
  ends_at: string | null;
}

export interface Referral {
  code: string;
  referrer_bonus: number;
  referee_bonus: number;
  min_order_total: number;
  referred_count: number;
  rewarded_count: number;
}

export interface VideoCard {
  id: number;
  slug: string;
  content_type: ContentType;
  category: string | null;
  title: string | null;
  thumbnail_url: string | null;
  duration_seconds: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_members_only: boolean;
  published_at: string | null;
  is_saved: boolean;
}

export interface VideoDetail extends VideoCard {
  description: string | null;
  video_url: string | null;
  tags: string[];
  shop_the_look: ProductCard[];
  is_liked: boolean;
  author: { name: string; avatar_url: string | null };
}

export interface Comment {
  id: number;
  parent_id: number | null;
  body: string;
  user: { name: string; avatar_url: string | null };
  created_at: string | null;
}

export interface RecipeCard {
  id: number;
  slug: string;
  category: string | null;
  title: string | null;
  title_th: string | null;
  cover_image_url: string | null;
  total_minutes: number;
  difficulty: Difficulty;
  spice_level: number;
  servings: number;
  has_video: boolean;
  is_saved: boolean;
}

export interface RecipeDetail extends RecipeCard {
  description: string | null;
  tips: string | null;
  prep_minutes: number;
  cook_minutes: number;
  video?: VideoCard | null;
  video_url?: string | null;
  ingredients: { id: number; name: string | null; quantity: string | null; unit: string | null; product_id: number | null }[];
  steps: { number: number; instruction: string | null; image_url: string | null; timer_seconds: number | null }[];
}

export interface KitchenFeed {
  banners: Banner[];
  todays_kitchen: RecipeCard[];
  categories: string[];
  latest: RecipeCard[];
  tutorials: VideoCard[];
}

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  data: { route?: string; celebrate?: 'points' | 'tier_upgrade'; [key: string]: unknown };
  read_at: string | null;
  created_at: string | null;
}

export interface SearchResults {
  query: string;
  products: ProductCard[];
  collections: Collection[];
  videos: VideoCard[];
  recipes: RecipeCard[];
}
