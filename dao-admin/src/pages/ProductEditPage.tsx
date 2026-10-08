import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { VariantsEditor } from '@/components/product/VariantsEditor'
import { VideoPicker } from '@/components/resource/VideoPicker'
import {
  Button, DAOAdminCard, DAOAdminHeader, DAOConfirmDialog, DAOStatusBadge, ErrorState, Field, Input, Select, TableSkeleton, Toggle,
  TranslationTabs, useToast,
} from '@/components/ui'
import { api, ApiError, errorMessage } from '@/lib/api'
import { fromLocalInput, toLocalInput, toMajor, toMinor } from '@/lib/format'
import { uploadViaPresign } from '@/lib/upload'
import type { Paged, ProductDetail, Translations } from '@/types/api'

const BADGES = ['new', 'bestseller', 'dao_pick', 'limited', 'vip', 'sale'] as const
type Form = Omit<ProductDetail, 'price' | 'sale_price' | 'member_price' | 'cost'> & { price: string; sale_price: string; member_price: string; cost: string }

const blank: Form = {
  id: 0, category_id: null, slug: '', brand: 'DAO', sku: '', barcode: '', price: '', sale_price: '', member_price: '', cost: '', weight_grams: null,
  status: 'draft', badges: [], is_vip_only: false, vip_min_tier_id: null, video_url: '', external_url: '', social_platform: null, campaign_code: '',
  published_at: null, translations: {}, images: [], variants: [], collection_ids: [], video_ids: [],
}

export default function ProductEditPage() {
  const { id } = useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const qc = useQueryClient()
  const toast = useToast()
  const [form, setForm] = useState<Form>(blank)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const product = useQuery({ queryKey: ['product', id], queryFn: () => api.get<ProductDetail>(`/products/${id}`), enabled: !isNew })
  const categories = useQuery({ queryKey: ['category-options'], queryFn: () => api.page<Paged<{ id: number; slug: string; display_name: string | null }>>('/categories', { per_page: 100 }) })
  const collections = useQuery({ queryKey: ['collection-options'], queryFn: () => api.page<Paged<{ id: number; slug: string; display_name: string | null }>>('/collections', { per_page: 100 }) })

  useEffect(() => {
    const p = product.data
    if (p) setForm({ ...p, price: toMajor(p.price), sale_price: toMajor(p.sale_price), member_price: toMajor(p.member_price), cost: toMajor(p.cost), badges: p.badges ?? [] })
  }, [product.data])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))
  const refresh = () => void qc.invalidateQueries({ queryKey: ['product', id] })

  const save = useMutation({
    mutationFn: () => {
      const body = {
        category_id: form.category_id, brand: form.brand || null, sku: form.sku || null, barcode: form.barcode || null,
        price: toMinor(form.price), sale_price: toMinor(form.sale_price), member_price: toMinor(form.member_price), cost: toMinor(form.cost),
        weight_grams: form.weight_grams, badges: form.badges, is_vip_only: form.is_vip_only, video_url: form.video_url || null,
        external_url: form.external_url || null, social_platform: form.social_platform, campaign_code: form.campaign_code || null,
        published_at: form.published_at, translations: form.translations, collection_ids: form.collection_ids, video_ids: form.video_ids,
        ...(form.slug ? { slug: form.slug } : {}),
      }
      return isNew ? api.post<ProductDetail>('/products', body) : api.put<ProductDetail>(`/products/${id}`, body)
    },
    onSuccess: (p) => { toast('Product saved'); if (isNew) navigate(`/products/${p.id}`, { replace: true }); else refresh(); void qc.invalidateQueries({ queryKey: ['products'] }) },
    onError: (e) => toast(errorMessage(e), 'error'),
  })
  const publish = useMutation({
    mutationFn: (on: boolean) => api.post(`/products/${id}/${on ? 'publish' : 'unpublish'}`),
    onSuccess: () => { toast('Status updated'); refresh() },
    onError: (e) => toast(errorMessage(e), 'error'),
  })
  const remove = useMutation({ mutationFn: () => api.del(`/products/${id}`), onSuccess: () => { toast('Product archived'); navigate('/products') } })
  const imageAction = useMutation({
    mutationFn: async (a: { kind: 'upload'; file: File; color: string } | { kind: 'delete'; imageId: number } | { kind: 'order'; ids: number[] }) => {
      if (a.kind === 'upload') { const { key } = await uploadViaPresign(`/products/${id}/images/presign`, a.file); return api.post(`/products/${id}/images`, { key, color: a.color || undefined }) }
      if (a.kind === 'delete') return api.del(`/products/${id}/images/${a.imageId}`)
      return api.put(`/products/${id}/images/order`, { ids: a.ids })
    },
    onSuccess: refresh,
    onError: (e) => toast(errorMessage(e), 'error'),
  })

  if (!isNew && product.isPending) return <TableSkeleton />
  if (!isNew && product.isError) return <ErrorState error={product.error} onRetry={() => void product.refetch()} />
  const err = (k: string) => (save.error instanceof ApiError ? save.error.field(k) : undefined)
  const move = (i: number, d: -1 | 1) => { const ids = form.images.map((x) => x.id); const j = i + d; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j]!, ids[i]!]; imageAction.mutate({ kind: 'order', ids }) }

  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-6">
      <DAOAdminHeader title={isNew ? 'New product' : (form.translations.en?.name as string) || 'Product'}
        subtitle={isNew ? 'Save details first, then add variants and photos.' : undefined}
        actions={<>
          {!isNew ? <DAOStatusBadge status={form.status} /> : null}
          {!isNew && form.status !== 'published' ? <Button type="button" variant="gold" onClick={() => publish.mutate(true)} loading={publish.isPending}>Publish</Button> : null}
          {!isNew && form.status === 'published' ? <Button type="button" variant="secondary" onClick={() => publish.mutate(false)} loading={publish.isPending}>Unpublish</Button> : null}
          <Button type="submit" loading={save.isPending}>Save</Button>
        </>} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <DAOAdminCard title="Content (EN · TH · MY)">
            <TranslationTabs<'name' | 'description' | 'materials' | 'care_instructions' | 'shipping_info'>
              fields={[{ name: 'name', label: 'Name', required: true }, { name: 'description', label: 'Description', multiline: true }, { name: 'materials', label: 'Materials', multiline: true }, { name: 'care_instructions', label: 'Care instructions', multiline: true }, { name: 'shipping_info', label: 'Shipping information', multiline: true }]}
              value={form.translations} onChange={(t) => set('translations', t as Translations<'name'>)} errors={err} />
          </DAOAdminCard>
          {!isNew ? <VariantsEditor productId={Number(id)} variants={form.variants} onChanged={refresh} /> : null}
          {!isNew ? (
            <DAOAdminCard title="Photos" actions={
              <label className="cursor-pointer text-sm text-primary hover:underline">Upload photo
                <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="sr-only" onChange={(e) => e.target.files?.[0] && imageAction.mutate({ kind: 'upload', file: e.target.files[0], color: '' })} />
              </label>}>
              {form.images.length === 0 ? <p className="text-sm text-ink-muted">No photos yet. Portrait (3:4 or 4:5) editorial photos look best.</p> : (
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {form.images.map((img, i) => (
                    <li key={img.id} className="space-y-2">
                      <img src={img.thumbnail_url ?? img.url} alt={img.alt ?? ''} className="aspect-[3/4] w-full rounded-xl object-cover" />
                      <div className="flex items-center justify-between text-ink-muted">
                        <span className="text-xs">{i === 0 ? 'Cover' : `#${i + 1}`}{img.color ? ` · ${img.color}` : ''}</span>
                        <span className="flex gap-1">
                          <button type="button" aria-label="Move earlier" onClick={() => move(i, -1)}><ArrowUp className="size-4" /></button>
                          <button type="button" aria-label="Move later" onClick={() => move(i, 1)}><ArrowDown className="size-4" /></button>
                          <button type="button" aria-label="Delete photo" onClick={() => imageAction.mutate({ kind: 'delete', imageId: img.id })}><Trash2 className="size-4 text-danger" /></button>
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </DAOAdminCard>
          ) : null}
        </div>
        <div className="space-y-6">
          <DAOAdminCard title="Pricing (฿)">
            <div className="grid gap-4">
              <Field label="Price *" error={err('price')}><Input type="number" step="0.01" required value={form.price} onChange={(e) => set('price', e.target.value)} /></Field>
              <Field label="Sale price" error={err('sale_price')}><Input type="number" step="0.01" value={form.sale_price} onChange={(e) => set('sale_price', e.target.value)} /></Field>
              <Field label="Member price" hint="Shown to signed-in DAO members"><Input type="number" step="0.01" value={form.member_price} onChange={(e) => set('member_price', e.target.value)} /></Field>
              <Field label="Cost" hint="Internal only — never sent to the app"><Input type="number" step="0.01" value={form.cost} onChange={(e) => set('cost', e.target.value)} /></Field>
            </div>
          </DAOAdminCard>
          <DAOAdminCard title="Organization">
            <div className="grid gap-4">
              <Field label="Category"><Select value={form.category_id ?? ''} onChange={(e) => set('category_id', e.target.value ? Number(e.target.value) : null)}>
                <option value="">—</option>{categories.data?.data.map((c) => <option key={c.id} value={c.id}>{c.display_name ?? c.slug}</option>)}
              </Select></Field>
              <Field label="Collections">
                <div className="flex flex-wrap gap-2">{collections.data?.data.map((c) => {
                  const on = form.collection_ids.includes(c.id)
                  return <button key={c.id} type="button" aria-pressed={on} onClick={() => set('collection_ids', on ? form.collection_ids.filter((x) => x !== c.id) : [...form.collection_ids, c.id])}
                    className={`rounded-full px-3 py-1 text-xs ${on ? 'bg-primary text-on-primary' : 'bg-muted'}`}>{c.display_name ?? c.slug}</button>
                })}</div>
              </Field>
              <Field label="Badges"><div className="flex flex-wrap gap-2">{BADGES.map((b) => {
                const on = (form.badges ?? []).includes(b)
                return <button key={b} type="button" aria-pressed={on} onClick={() => set('badges', on ? (form.badges ?? []).filter((x) => x !== b) : [...(form.badges ?? []), b])}
                  className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${on ? 'bg-gold text-white' : 'bg-muted'}`}>{b.replace('_', ' ')}</button>
              })}</div></Field>
              <Toggle label="VIP-only piece" checked={form.is_vip_only} onChange={(v) => set('is_vip_only', v)} />
              <Field label="Slug" hint="Generated from the English name if empty"><Input value={form.slug} onChange={(e) => set('slug', e.target.value)} /></Field>
              <Field label="Brand"><Input value={form.brand ?? ''} onChange={(e) => set('brand', e.target.value)} /></Field>
              <Field label="Base SKU" error={err('sku')}><Input value={form.sku ?? ''} onChange={(e) => set('sku', e.target.value)} /></Field>
              <Field label="Barcode"><Input value={form.barcode ?? ''} onChange={(e) => set('barcode', e.target.value)} /></Field>
              <Field label="Weight (g)"><Input type="number" value={form.weight_grams ?? ''} onChange={(e) => set('weight_grams', e.target.value ? Number(e.target.value) : null)} /></Field>
              <Field label="Publish at" hint="Leave empty to publish immediately"><Input type="datetime-local" value={toLocalInput(form.published_at)} onChange={(e) => set('published_at', fromLocalInput(e.target.value))} /></Field>
            </div>
          </DAOAdminCard>
          <DAOAdminCard title="Video & social">
            <div className="grid gap-4">
              <Field label="Product video URL"><Input value={form.video_url ?? ''} onChange={(e) => set('video_url', e.target.value)} /></Field>
              <Field label="External shop URL" hint="e.g. the same piece on TikTok Shop (link only)"><Input value={form.external_url ?? ''} onChange={(e) => set('external_url', e.target.value)} /></Field>
              <Field label="Platform"><Select value={form.social_platform ?? ''} onChange={(e) => set('social_platform', e.target.value || null)}>
                <option value="">—</option>{['tiktok', 'instagram', 'facebook', 'line', 'other'].map((p) => <option key={p} value={p}>{p}</option>)}
              </Select></Field>
              <Field label="Campaign code"><Input value={form.campaign_code ?? ''} onChange={(e) => set('campaign_code', e.target.value)} /></Field>
            </div>
          </DAOAdminCard>
          <DAOAdminCard title="Dao's review">
            <VideoPicker label="Linked videos" value={form.video_ids} onChange={(ids) => set('video_ids', ids)} />
            <p className="mt-2 text-xs text-ink-subtle">Shows on the product page in the app. Same link as that video's own "Shop this look" — add here or there, either way links both pages.</p>
          </DAOAdminCard>
          {!isNew ? <Button type="button" variant="danger" className="w-full" onClick={() => setConfirmDelete(true)}>Archive product</Button> : null}
        </div>
      </div>
      <DAOConfirmDialog open={confirmDelete} title="Archive this product?" message="It disappears from the app. Past orders keep their snapshot." destructive loading={remove.isPending} onClose={() => setConfirmDelete(false)} onConfirm={() => remove.mutate()} />
    </form>
  )
}
