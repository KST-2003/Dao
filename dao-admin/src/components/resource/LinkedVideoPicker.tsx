import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui'
import { api } from '@/lib/api'
import type { Paged, VideoRow } from '@/types/api'

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/** Search-and-pick a single video by title, caption, slug or ID. */
export function LinkedVideoPicker({ value, onChange, label = 'Linked video' }: { value: number | null; onChange: (id: number | null) => void; label?: string }) {
  const [q, setQ] = useState('')
  const search = useQuery({ queryKey: ['video-search', q], queryFn: () => api.page<Paged<VideoRow>>('/videos', { q, per_page: 8 }), enabled: q.trim().length >= 1 })
  const current = useQuery({ queryKey: ['video-name', value], queryFn: () => api.get<{ id: number; translations: { en?: { title?: string } } }>(`/videos/${value}`), enabled: value != null })
  const title = current.data?.translations?.en?.title

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      {value != null ? (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-primary-soft px-3 py-1.5 text-sm text-primary">
          <span className="truncate">{title ?? `Video #${value}`} <span className="text-ink-subtle">#{value}</span></span>
          <button type="button" aria-label="Unlink video" className="shrink-0" onClick={() => onChange(null)}><X className="size-4" /></button>
        </div>
      ) : <p className="text-xs text-ink-subtle">No video linked.</p>}
      <Input placeholder="Search videos by title, caption or ID…" value={q} onChange={(e) => setQ(e.target.value)} />
      {q.trim().length >= 1 && search.data ? (
        <ul className="max-h-48 overflow-y-auto rounded-xl border border-line bg-surface text-sm">
          {search.data.data.length === 0 ? <li className="px-3 py-2 text-ink-subtle">No videos found.</li> : search.data.data.map((v) => (
            <li key={v.id}><button type="button" className="w-full px-3 py-2 text-left hover:bg-muted" onClick={() => { onChange(v.id); setQ('') }}>{v.title ?? `#${v.id}`} <span className="text-ink-subtle">#{v.id} · {v.content_type}{v.duration_seconds ? ` · ${clock(v.duration_seconds)}` : ''}</span></button></li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
