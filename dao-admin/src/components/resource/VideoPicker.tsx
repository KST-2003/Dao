import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useState } from 'react'
import { Field, Input } from '@/components/ui'
import { api } from '@/lib/api'
import type { Paged, VideoRow } from '@/types/api'

/** Search-and-add video selector — the product side of "Shop this look" (same product_video link, reverse direction). */
export function VideoPicker({ value, onChange, label = 'Videos' }: { value: number[]; onChange: (ids: number[]) => void; label?: string }) {
  const [q, setQ] = useState('')
  const search = useQuery({ queryKey: ['video-search', q], queryFn: () => api.page<Paged<VideoRow>>('/videos', { q, per_page: 8 }), enabled: q.length >= 2 })
  const selected = useQuery({
    queryKey: ['video-titles', value],
    queryFn: async () => Promise.all(value.map((id) => api.get<{ id: number; title: string | null }>(`/videos/${id}`).catch(() => ({ id, title: `#${id}` })))),
    enabled: value.length > 0,
  })
  const title = (id: number) => selected.data?.find((v) => v.id === id)?.title ?? `#${id}`

  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-2">
        {value.map((id) => (
          <span key={id} className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-xs text-primary">
            {title(id)}
            <button type="button" aria-label={`Remove ${title(id)}`} onClick={() => onChange(value.filter((x) => x !== id))}><X className="size-3" /></button>
          </span>
        ))}
      </div>
      <Input placeholder="Search videos by title…" value={q} onChange={(e) => setQ(e.target.value)} />
      {q.length >= 2 && search.data ? (
        <ul className="max-h-48 overflow-y-auto rounded-xl border border-line bg-surface text-sm">
          {search.data.data.filter((v) => !value.includes(v.id)).map((v) => (
            <li key={v.id}><button type="button" className="w-full px-3 py-2 text-left hover:bg-muted" onClick={() => { onChange([...value, v.id]); setQ('') }}>{v.title} <span className="text-ink-subtle">{v.content_type}</span></button></li>
          ))}
        </ul>
      ) : null}
    </Field>
  )
}
