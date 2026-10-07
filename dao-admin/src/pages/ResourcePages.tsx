import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ResourcePage, type ResourceConfig } from '@/components/resource/ResourcePage'
import { DAOStatusBadge } from '@/components/ui'
import { api } from '@/lib/api'
import { date, money, num } from '@/lib/format'
import type { Paged } from '@/types/api'

type Row = { id: number; [k: string]: unknown }
const s = (v: unknown) => (v == null || v === '' ? '—' : String(v))
const active = (v: unknown) => <DAOStatusBadge status={v ? 'active' : 'inactive'} />
const thumb = (url: unknown) => (url ? <img src={String(url)} alt="" className="h-10 w-14 rounded-md object-cover" /> : <span className="text-ink-subtle">—</span>)

function useTierOptions() {
  const q = useQuery({ queryKey: ['tier-options'], queryFn: () => api.page<Paged<{ id: number; code: string; display_name: string | null }>>('/membership-tiers', { per_page: 50 }) })
  return (q.data?.data ?? []).map((t) => ({ value: String(t.id), label: t.display_name ?? t.code }))
}

function useCategoryOptions() {
  const q = useQuery({ queryKey: ['category-options'], queryFn: () => api.page<Paged<{ id: number; slug: string; display_name: string | null }>>('/categories', { per_page: 100 }) })
  return (q.data?.data ?? []).map((c) => ({ value: String(c.id), label: c.display_name ?? c.slug }))
}

export function CategoriesPage() {
  const categories = useCategoryOptions()
  const config: ResourceConfig<Row> = {
    title: 'Categories', subtitle: 'Fashion categories shown in the Shop. Names in English, Thai and Myanmar.', endpoint: '/categories',
    columns: [
      { key: 'img', header: '', render: (r) => thumb(r.image_url) },
      { key: 'name', header: 'Name', render: (r) => s(r.display_name) },
      { key: 'slug', header: 'Slug', render: (r) => s(r.slug) },
      { key: 'sort', header: 'Order', render: (r) => s(r.sort_order) },
      { key: 'active', header: 'Status', render: (r) => active(r.is_active) },
    ],
    fields: [
      { name: 'slug', label: 'Slug', type: 'slug', required: true, hint: 'lowercase-with-dashes, used in links' },
      { name: 'parent_id', label: 'Parent category', type: 'select', options: categories, allowEmpty: true },
      { name: 'image_url', label: 'Image', type: 'image', folder: 'categories' },
      { name: 'sort_order', label: 'Sort order', type: 'number' },
      { name: 'is_active', label: 'Active', type: 'toggle' },
    ],
    translations: [{ name: 'name', label: 'Name', required: true }, { name: 'description', label: 'Description', multiline: true }],
    defaults: { is_active: true, sort_order: 0 },
  }
  return <ResourcePage config={config} />
}

export function CollectionsPage() {
  const config: ResourceConfig<Row> = {
    title: 'Collections', subtitle: 'New Season, DAO Essentials, Limited Drop, VIP Collection…', endpoint: '/collections',
    columns: [
      { key: 'img', header: '', render: (r) => thumb(r.hero_image_url) },
      { key: 'name', header: 'Name', render: (r) => s(r.display_name) },
      { key: 'slug', header: 'Slug', render: (r) => s(r.slug) },
      { key: 'featured', header: 'Featured', render: (r) => (r.is_featured ? '✦' : '') },
      { key: 'dates', header: 'Live', render: (r) => `${date(r.starts_at as string)} → ${date(r.ends_at as string)}` },
      { key: 'status', header: 'Status', render: (r) => <DAOStatusBadge status={r.is_published ? 'published' : 'draft'} /> },
    ],
    fields: [
      { name: 'slug', label: 'Slug', type: 'slug', required: true },
      { name: 'hero_image_url', label: 'Hero image', type: 'image', folder: 'collections' },
      { name: 'product_ids', label: 'Products (in display order)', type: 'products' },
      { name: 'sort_order', label: 'Sort order', type: 'number' },
      { name: 'starts_at', label: 'Starts', type: 'datetime' },
      { name: 'ends_at', label: 'Ends', type: 'datetime' },
      { name: 'is_published', label: 'Published', type: 'toggle' },
      { name: 'is_featured', label: 'Featured on Home', type: 'toggle' },
      { name: 'is_vip_only', label: 'VIP only', type: 'toggle' },
    ],
    translations: [{ name: 'name', label: 'Name', required: true }, { name: 'subtitle', label: 'Subtitle' }, { name: 'description', label: 'Description', multiline: true }],
    defaults: { product_ids: [], is_published: false, is_featured: false, is_vip_only: false, sort_order: 0 },
  }
  return <ResourcePage config={config} />
}

export function MembershipTiersPage() {
  const config: ResourceConfig<Row> = {
    title: 'Membership tiers',
    subtitle: 'A tier is reached when lifetime points OR lifetime spend meets its threshold (0 = not used). The lowest tier is the entry tier.',
    endpoint: '/membership-tiers',
    columns: [
      { key: 'name', header: 'Tier', render: (r) => <span className="font-medium" style={{ color: (r.color as string) ?? undefined }}>✦ {s(r.display_name)}</span> },
      { key: 'order', header: 'Rank', render: (r) => s(r.sort_order) },
      { key: 'pts', header: 'Min points', render: (r) => num(r.min_points as number) },
      { key: 'spend', header: 'Min spend', render: (r) => money(r.min_spend as number) },
      { key: 'disc', header: 'Discount', render: (r) => `${r.discount_percent}%` },
      { key: 'mult', header: 'Points ×', render: (r) => s(r.points_multiplier) },
      { key: 'members', header: 'Members', render: (r) => num(r.members as number) },
      { key: 'active', header: 'Status', render: (r) => active(r.is_active) },
    ],
    fields: [
      { name: 'code', label: 'Code', type: 'slug', required: true, hint: 'internal id, e.g. vip' },
      { name: 'sort_order', label: 'Rank (higher = better)', type: 'number' },
      { name: 'min_points', label: 'Minimum lifetime points', type: 'number' },
      { name: 'min_spend', label: 'Minimum lifetime spend', type: 'money' },
      { name: 'discount_percent', label: 'Member discount %', type: 'number' },
      { name: 'points_multiplier', label: 'Points multiplier', type: 'number' },
      { name: 'color', label: 'Badge color (#hex)', type: 'text' },
      { name: 'badge_icon', label: 'Badge icon key', type: 'text' },
      { name: 'free_shipping', label: 'Free standard shipping', type: 'toggle' },
      { name: 'early_access', label: 'Early access to collections', type: 'toggle' },
      { name: 'priority_support', label: 'Priority support', type: 'toggle' },
      { name: 'allows_screenshots', label: 'Can screenshot/record video content', type: 'toggle' },
      { name: 'allows_video_download', label: 'Can download videos to their device', type: 'toggle' },
      { name: 'is_active', label: 'Active', type: 'toggle' },
    ],
    translations: [{ name: 'name', label: 'Name', required: true }, { name: 'description', label: 'Description', multiline: true }, { name: 'benefits', label: 'Benefits', list: true }],
    defaults: { sort_order: 10, min_points: 0, min_spend: '', discount_percent: 0, points_multiplier: 1, is_active: true, allows_screenshots: false, allows_video_download: false },
    deleteLabel: 'Delete tier',
  }
  return <ResourcePage config={config} />
}

export function RewardsPage() {
  const tiers = useTierOptions()
  const config: ResourceConfig<Row> = {
    title: 'Rewards', subtitle: 'What members can redeem DAO Points for. Coupon rewards issue a personal single-use code.', endpoint: '/rewards',
    columns: [
      { key: 'name', header: 'Reward', render: (r) => s(r.display_name) },
      { key: 'type', header: 'Type', render: (r) => s(r.type) },
      { key: 'cost', header: 'Points', render: (r) => num(r.points_cost as number) },
      { key: 'stock', header: 'Stock', render: (r) => (r.stock == null ? '∞' : s(r.stock)) },
      { key: 'active', header: 'Status', render: (r) => active(r.is_active) },
    ],
    fields: [
      { name: 'code', label: 'Code', type: 'slug', required: true },
      { name: 'type', label: 'Type', type: 'select', options: [{ value: 'discount_coupon', label: 'Discount coupon' }, { value: 'free_shipping', label: 'Free shipping coupon' }, { value: 'gift', label: 'Gift (fulfilled by staff)' }] },
      { name: 'points_cost', label: 'Points cost', type: 'number', required: true },
      { name: 'value_type', label: 'Value type', type: 'select', options: [{ value: 'fixed', label: 'Fixed amount' }, { value: 'percent', label: 'Percent' }] },
      { name: 'value', label: 'Value', type: 'number', hint: 'Percent: 10 = 10%. Fixed: satang (฿50 = 5000).' },
      { name: 'min_subtotal', label: 'Minimum order', type: 'money' },
      { name: 'min_tier_id', label: 'Minimum tier', type: 'select', options: tiers, allowEmpty: true },
      { name: 'stock', label: 'Stock (empty = unlimited)', type: 'number' },
      { name: 'coupon_valid_days', label: 'Coupon valid for (days)', type: 'number' },
      { name: 'image_url', label: 'Image', type: 'image', folder: 'rewards' },
      { name: 'starts_at', label: 'Starts', type: 'datetime' },
      { name: 'ends_at', label: 'Ends', type: 'datetime' },
      { name: 'is_active', label: 'Active', type: 'toggle' },
    ],
    translations: [{ name: 'name', label: 'Name', required: true }, { name: 'description', label: 'Description', multiline: true }],
    defaults: { type: 'discount_coupon', value_type: 'fixed', value: 0, coupon_valid_days: 30, is_active: true },
  }
  return <ResourcePage config={config} />
}

export function CouponsPage() {
  const tiers = useTierOptions()
  const config: ResourceConfig<Row> = {
    title: 'Coupons', subtitle: 'Promo codes. Deleting deactivates the code so past redemptions keep their history.', endpoint: '/coupons',
    columns: [
      { key: 'code', header: 'Code', render: (r) => <span className="font-mono">{s(r.code)}</span> },
      { key: 'type', header: 'Type', render: (r) => s(r.type) },
      { key: 'value', header: 'Value', render: (r) => (r.type === 'percentage' ? `${r.value}%` : r.type === 'fixed' ? money(r.value as number) : 'Free shipping') },
      { key: 'used', header: 'Used', render: (r) => <Link to={`/coupons/${r.id}/redemptions`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>{num(r.used_count as number)}{r.usage_limit ? ` / ${r.usage_limit}` : ''}</Link> },
      { key: 'ends', header: 'Ends', render: (r) => date(r.ends_at as string) },
      { key: 'active', header: 'Status', render: (r) => active(r.is_active) },
    ],
    fields: [
      { name: 'code', label: 'Code', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: [{ value: 'percentage', label: 'Percentage' }, { value: 'fixed', label: 'Fixed amount' }, { value: 'free_shipping', label: 'Free shipping' }] },
      { name: 'value', label: 'Value', type: 'number', hint: 'Percentage: 10 = 10%. Fixed: satang (฿100 = 10000).' },
      { name: 'max_discount', label: 'Max discount', type: 'money' },
      { name: 'min_subtotal', label: 'Minimum purchase', type: 'money' },
      { name: 'scope', label: 'Applies to', type: 'select', options: [{ value: 'all', label: 'Everything' }, { value: 'products', label: 'Selected products' }, { value: 'categories', label: 'Selected categories' }] },
      { name: 'product_ids', label: 'Products (when scope = products)', type: 'products' },
      { name: 'min_tier_id', label: 'Member-only (minimum tier)', type: 'select', options: tiers, allowEmpty: true },
      { name: 'usage_limit', label: 'Total usage limit', type: 'number' },
      { name: 'usage_limit_per_user', label: 'Per-customer limit', type: 'number' },
      { name: 'description', label: 'Description', type: 'text' },
      { name: 'starts_at', label: 'Starts', type: 'datetime' },
      { name: 'ends_at', label: 'Ends', type: 'datetime' },
      { name: 'is_active', label: 'Active', type: 'toggle' },
    ],
    defaults: { type: 'percentage', value: 10, scope: 'all', product_ids: [], is_active: true },
    deleteLabel: 'Deactivate',
  }
  return <ResourcePage config={config} />
}

export function BannersPage() {
  const config: ResourceConfig<Row> = {
    title: 'Banners', subtitle: 'Editorial banners for Home, Shop and Kitchen.', endpoint: '/banners',
    columns: [
      { key: 'img', header: '', render: (r) => thumb(r.image_url) },
      { key: 'placement', header: 'Placement', render: (r) => s(r.placement) },
      { key: 'link', header: 'Link', render: (r) => (r.link_type ? `${r.link_type}: ${r.link_value}` : '—') },
      { key: 'order', header: 'Order', render: (r) => s(r.sort_order) },
      { key: 'active', header: 'Status', render: (r) => active(r.is_active) },
    ],
    fields: [
      { name: 'placement', label: 'Placement', type: 'select', options: [{ value: 'home_hero', label: 'Home hero' }, { value: 'home_feature', label: 'Home feature' }, { value: 'shop_top', label: 'Shop top' }, { value: 'kitchen_top', label: 'Kitchen top' }] },
      { name: 'image_url', label: 'Image', type: 'image', folder: 'banners' },
      { name: 'link_type', label: 'Link type', type: 'select', allowEmpty: true, options: ['product', 'collection', 'category', 'video', 'recipe', 'url'].map((v) => ({ value: v, label: v })) },
      { name: 'link_value', label: 'Link value (id, slug or URL)', type: 'text' },
      { name: 'theme', label: 'Theme', type: 'select', options: [{ value: 'botanical', label: 'DAO Botanical' }, { value: 'midnight', label: 'DAO Midnight' }] },
      { name: 'sort_order', label: 'Sort order', type: 'number' },
      { name: 'starts_at', label: 'Starts', type: 'datetime' },
      { name: 'ends_at', label: 'Ends', type: 'datetime' },
      { name: 'is_active', label: 'Active', type: 'toggle' },
    ],
    translations: [{ name: 'eyebrow', label: 'Eyebrow (e.g. New Season)' }, { name: 'title', label: 'Title (e.g. DAO EDIT)' }, { name: 'subtitle', label: 'Subtitle' }, { name: 'cta_label', label: 'Button label' }],
    defaults: { placement: 'home_hero', theme: 'botanical', sort_order: 0, is_active: true },
  }
  return <ResourcePage config={config} />
}
