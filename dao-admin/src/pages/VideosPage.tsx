import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, DAOAdminHeader, DAODataTable, DAOStatusBadge, Input, type Column } from '@/components/ui'
import { api } from '@/lib/api'
import { dateTime, num } from '@/lib/format'
import type { Paged } from '@/types/api'

interface Row { id: number; title: string | null; content_type: string; category: string | null; status: string; thumbnail_url: string | null; duration_seconds: number; view_count: number; like_count: number; published_at: string | null }
const TYPES = ['', 'vlog', 'fashion', 'recipe', 'tutorial', 'short']

/** One content system for vlogs, fashion videos, recipe videos, tutorials and shorts. */
export default function VideosPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [type, setType] = useState('')
  const [q, setQ] = useState('')
  const query = useQuery({ queryKey: ['videos', page, type, q], queryFn: () => api.page<Paged<Row>>('/videos', { page, content_type: type || undefined, q: q || undefined }) })
  const columns: Column<Row>[] = [
    { key: 'img', header: '', render: (v) => (v.thumbnail_url ? <img src={v.thumbnail_url} alt="" className="h-14 w-10 rounded-md object-cover" /> : <div className="h-14 w-10 rounded-md bg-muted" />) },
    { key: 't', header: 'Title', render: (v) => <div><p className="font-medium">{v.title ?? '—'}</p><p className="text-xs text-ink-subtle">{v.content_type}{v.category ? ` · ${v.category}` : ''}</p></div> },
    { key: 'v', header: 'Views', render: (v) => num(v.view_count) },
    { key: 'l', header: 'Likes', render: (v) => num(v.like_count) },
    { key: 'p', header: 'Published', render: (v) => dateTime(v.published_at) },
    { key: 's', header: 'Status', render: (v) => <DAOStatusBadge status={v.status} /> },
  ]
  return (
    <>
      <DAOAdminHeader title="Videos & Vlogs" subtitle="Link products to a video to show “Shop this look” in the app."
        actions={<Button icon={<Plus className="size-4" />} onClick={() => navigate('/videos/new')}>New video</Button>} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TYPES.map((t) => <button key={t || 'all'} onClick={() => { setType(t); setPage(1) }} className={`rounded-full px-3 py-1 text-sm ${type === t ? 'bg-primary text-on-primary' : 'bg-muted'}`}>{t || 'all'}</button>)}
        <Input className="ml-auto max-w-xs" placeholder="Search titles…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
      </div>
      <DAODataTable columns={columns} query={query} page={page} onPage={setPage} rowKey={(v) => v.id} onRowClick={(v) => navigate(`/videos/${v.id}`)} />
    </>
  )
}
