/** Shapes returned by /api/admin/v1 (see dao-backend app/Http/Controllers/Admin). Money = minor units. */
export type Locale = 'en' | 'th' | 'my'
export const LOCALES: Locale[] = ['en', 'th', 'my']
export const LOCALE_LABELS: Record<Locale, string> = { en: 'English', th: 'ไทย', my: 'မြန်မာ' }

export type Translations<F extends string> = Partial<Record<Locale, Partial<Record<F, string | string[] | null>>>>

export interface Paged<T> {
  data: T[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}

export interface AdminMe {
  id: number
  name: string
  email: string
  role: { slug: string; name: string }
  permissions: string[]
}

export type Permission =
  | '*' | 'dashboard.view' | 'products.manage' | 'inventory.manage' | 'orders.view' | 'orders.manage'
  | 'customers.view' | 'customers.manage' | 'loyalty.manage' | 'marketing.manage' | 'content.manage' | 'reviews.moderate'
  | 'notifications.send' | 'settings.manage' | 'admins.manage' | 'audit.view'

export interface DashboardMetrics {
  range: { from: string; to: string }
  revenue: number
  orders: number
  paid_orders: number
  customers: number
  new_customers: number
  pending_orders: number
  points_issued: number
  points_redeemed: number
  video_views: number
  revenue_by_day: { day: string; revenue: number; orders: number }[]
  top_products: { product_id: number; name: string; units: number; revenue: number }[]
  low_stock: { variant_id: number; product_id: number; name: string | null; label: string; sku: string; stock: number }[]
  membership_distribution: { code: string; members: number }[]
}

export interface ProductRow {
  id: number; name: string | null; slug: string; sku: string | null; image_url: string | null; category: string | null
  price: number; sale_price: number | null; status: 'draft' | 'published' | 'archived'; stock: number; variant_count: number
  badges: string[]; updated_at: string | null
}

export interface Variant {
  id: number; sku: string; size: string | null; color: string | null; color_hex: string | null; price_override: number | null
  sale_price_override: number | null; stock_quantity: number; low_stock_threshold: number; is_active: boolean; sort_order: number
}

export interface ProductImage { id: number; url: string; thumbnail_url: string | null; alt: string | null; color: string | null; sort_order: number }

export interface ProductDetail {
  id: number; category_id: number | null; slug: string; brand: string | null; sku: string | null; barcode: string | null
  price: number; sale_price: number | null; member_price: number | null; cost: number | null; weight_grams: number | null
  status: 'draft' | 'published' | 'archived'; badges: string[] | null; is_vip_only: boolean; vip_min_tier_id: number | null
  video_url: string | null; external_url: string | null; social_platform: string | null; campaign_code: string | null
  published_at: string | null
  translations: Translations<'name' | 'description' | 'materials' | 'care_instructions' | 'shipping_info'>
  images: ProductImage[]; variants: Variant[]; collection_ids: number[]
}

export interface CouponRedemption {
  id: number
  customer: { id: number; name: string | null; phone: string | null; email: string | null }
  order: { id: number; number: string }
  discount_amount: number
  redeemed_at: string
  released_at: string | null
}

export interface OrderRow {
  id: number; order_number: string; customer: string | null; status: string; payment_status: string; payment_method: string
  grand_total: number; currency: string; items_count: number; placed_at: string | null
}

export interface OrderDetail {
  id: number; order_number: string; status: string; payment_status: string; payment_method: string; delivery_method: string
  currency: string; subtotal: number; member_discount: number; coupon_discount: number; points_discount: number
  shipping_fee: number; grand_total: number; points_redeemed: number; points_earned: number; coupon_code: string | null
  notes: string | null; placed_at: string; paid_at: string | null
  shipping_address: Record<string, string | null>
  items: { id: number; product_name: string; variant_label: string | null; sku: string; image_url: string | null; unit_price: number; quantity: number; line_total: number }[]
  customer: { id: number; name: string | null; display_name: string | null; phone: string | null; email: string | null } | null
  history: { id: number; from_status: string | null; to_status: string; note: string | null; created_at: string }[]
  payments: { id: number; provider: string; provider_reference: string | null; amount: number; status: string; paid_at: string | null }[]
  shipment: { carrier: string | null; tracking_number: string | null; tracking_url: string | null; status: string } | null
  allowed_next: string[]
}

export interface CustomerRow {
  id: number; name: string | null; phone: string | null; email: string | null; language: string; tier: string | null
  points: number; orders_count: number; total_spent: number; referral_code: string; registered_at: string | null
  last_active_at: string | null; deleted: boolean
}

export interface CustomerDetail extends CustomerRow {
  date_of_birth: string | null; gender: string | null; country: string | null
  providers: { provider: string; linked_at: string | null }[]
  addresses: Record<string, unknown>[]
  referred_by: { id: number; display_name: string | null; referral_code: string } | null
  recent_orders: { id: number; order_number: string; status: string; grand_total: number; placed_at: string }[]
  lifetime_spend: number
  screenshot_override: boolean
  download_override: boolean
}

export interface LedgerRow {
  id: number; user: { id: number; name: string | null } | null; type: string; points: number; balance_after: number
  description: string | null; reference: string | null; admin: string | null; expires_at: string | null; created_at: string | null
}

export interface ApiErrorBody { message: string; code: string; errors?: Record<string, string[] | unknown> }
