import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ProductPicker } from '@/components/resource/ProductPicker'
import {
  Button, DAOAdminCard, DAOAdminHeader, DAOConfirmDialog, DAOImageUploader, DAOVideoUploader, ErrorState, Field, Input, Select, TableSkeleton, Toggle,
  TranslationTabs, useToast,
} from '@/components/ui'
import { api, ApiError, errorMessage } from '@/lib/api'
import { fromLocalInput, toLocalInput } from '@/lib/format'
import type { Translations } from '@/types/api'

interface VideoForm {
  id?: number; content_type: string; category: string | null; slug: string; thumbnail_url: string | null; video_url: string | null
  duration_seconds: number; status: string; tags: string[]; is_members_only: boolean; published_at: string | null
  translations: Translations<'title' | 'description'>; products: { id: number; timestamp_seconds: number | null }[]
}
const blank: VideoForm = { content_type: 'vlog', category: 'daos_life', slug: '', thumbnail_url: null, video_url: null, duration_seconds: 0, status: 'draft', tags: [], is_members_only: false, published_at: null, translations: {}, products: [] }
const CATEGORIES = ['daily_life', 'fashion', 'travel', 'beauty', 'food', 'behind_the_scenes', 'daos_life']

export default function VideoEditPage() {
  const { id } = useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState<VideoForm>(blank)
  const [confirm, setConfirm] = useState(false)
  const q = useQuery({ queryKey: ['video', id], queryFn: () => api.get<VideoForm & { products: { id: number; timestamp_seconds: number | null }[] }>(`/videos/${id}`), enabled: !isNew })
  useEffect(() => { if (q.data) setForm({ ...blank, ...q.data, tags: q.data.tags ?? [] }) }, [q.data])
  const set = <K extends keyof VideoForm>(k: K, v: VideoForm[K]) => setForm((f) => ({ ...f, [k]: v }))

  const save = useMutation({
    mutationFn: () => {
      const { id: _id, ...body } = form
      return isNew ? api.post<{ id: number }>('/videos', body) : api.put<{ id: number }>(`/videos/${id}`, body)
    },
    onSuccess: (v) => { toast('Saved'); if (isNew) navigate(`/videos/${v.id}`, { replace: true }) },
    onError: (e) => toast(errorMessage(e), 'error'),
  })
  const remove = useMutation({ mutationFn: () => api.del(`/videos/${id}`), onSuccess: () => navigate('/videos') })

  if (!isNew && q.isPending) return <TableSkeleton />
  if (!isNew && q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />
  const err = (k: string) => (save.error instanceof ApiError ? save.error.field(k) : undefined)

  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-6">
      <DAOAdminHeader title={isNew ? 'New video' : (form.translations.en?.title as string) || 'Video'} actions={<Button type="submit" loading={save.isPending}>Save</Button>} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <DAOAdminCard title="Title & description (EN · TH · MY)">
            <TranslationTabs<'title' | 'description'> fields={[{ name: 'title', label: 'Title', required: true }, { name: 'description', label: 'Description', multiline: true }]} value={form.translations} onChange={(t) => set('translations', t)} errors={err} />
            <p className="mt-2 text-xs text-ink-subtle">Vlogs & Kitchen are Thai-first — please fill ไทย.</p>
          </DAOAdminCard>
          <DAOAdminCard title="Shop this look">
            <ProductPicker label="Featured products" value={form.products.map((p) => p.id)} onChange={(ids) => set('products', ids.map((pid) => form.products.find((p) => p.id === pid) ?? { id: pid, timestamp_seconds: null }))} />
          </DAOAdminCard>
        </div>
        <div className="space-y-6">
          <DAOAdminCard title="Media">
            <div className="grid gap-4">
              <DAOImageUploader label="Thumbnail (9:16)" folder="thumbnails" value={form.thumbnail_url} onChange={(v) => set('thumbnail_url', v)} />
              <DAOVideoUploader label="Video file (MP4)" folder="videos" value={form.video_url} onChange={(v) => set('video_url', v)} />
              <Field label="…or stream URL (HLS .m3u8 preferred)" error={err('video_url')}><Input value={form.video_url ?? ''} onChange={(e) => set('video_url', e.target.value || null)} /></Field>
              <Field label="Duration (seconds)"><Input type="number" min={0} value={form.duration_seconds} onChange={(e) => set('duration_seconds', Number(e.target.value))} /></Field>
            </div>
          </DAOAdminCard>
          <DAOAdminCard title="Publishing">
            <div className="grid gap-4">
              <Field label="Type"><Select value={form.content_type} onChange={(e) => set('content_type', e.target.value)}>{['vlog', 'fashion', 'recipe', 'tutorial', 'short'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
              <Field label="Category"><Select value={form.category ?? ''} onChange={(e) => set('category', e.target.value || null)}><option value="">—</option>{CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}</Select></Field>
              <Field label="Slug *" error={err('slug')}><Input required value={form.slug} onChange={(e) => set('slug', e.target.value)} /></Field>
              <Field label="Tags" hint="comma separated"><Input value={form.tags.join(', ')} onChange={(e) => set('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))} /></Field>
              <Field label="Status"><Select value={form.status} onChange={(e) => set('status', e.target.value)}>{['draft', 'scheduled', 'published', 'archived'].map((s) => <option key={s}>{s}</option>)}</Select></Field>
              <Field label="Publish at" hint="Required for published/scheduled"><Input type="datetime-local" value={toLocalInput(form.published_at)} onChange={(e) => set('published_at', fromLocalInput(e.target.value))} /></Field>
              <Toggle label="Members only" checked={form.is_members_only} onChange={(v) => set('is_members_only', v)} />
            </div>
          </DAOAdminCard>
          {!isNew ? <Button type="button" variant="danger" className="w-full" onClick={() => setConfirm(true)}>Delete video</Button> : null}
        </div>
      </div>
      <DAOConfirmDialog open={confirm} title="Delete this video?" destructive loading={remove.isPending} onClose={() => setConfirm(false)} onConfirm={() => remove.mutate()} />
    </form>
  )
}
