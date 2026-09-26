import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, DAOAdminHeader, DAODataTable, DAOStatusBadge, Input, type Column } from '@/components/ui'
import { api } from '@/lib/api'
import { dateTime } from '@/lib/format'
import type { Paged } from '@/types/api'

interface Row { id: number; title: string | null; title_th: string | null; category: string | null; status: string; cover_image_url: string | null; difficulty: string; is_featured: boolean; published_at: string | null }

export default function RecipesPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const query = useQuery({ queryKey: ['recipes', page, q], queryFn: () => api.page<Paged<Row>>('/recipes', { page, q: q || undefined }) })
  const columns: Column<Row>[] = [
    { key: 'img', header: '', render: (r) => (r.cover_image_url ? <img src={r.cover_image_url} alt="" className="h-12 w-16 rounded-md object-cover" /> : <div className="h-12 w-16 rounded-md bg-muted" />) },
    { key: 't', header: 'Recipe', render: (r) => <div><p className="font-medium">{r.title}</p><p className="text-xs text-ink-subtle">{r.title_th}</p></div> },
    { key: 'c', header: 'Category', render: (r) => r.category ?? '—' },
    { key: 'd', header: 'Difficulty', render: (r) => r.difficulty },
    { key: 'f', header: "Today's Kitchen", render: (r) => (r.is_featured ? '✦' : '') },
    { key: 'p', header: 'Published', render: (r) => dateTime(r.published_at) },
    { key: 's', header: 'Status', render: (r) => <DAOStatusBadge status={r.status} /> },
  ]
  return (
    <>
      <DAOAdminHeader title="Kitchen recipes" subtitle="Thai homemade — a lifestyle section inside DAO." actions={<Button icon={<Plus className="size-4" />} onClick={() => navigate('/recipes/new')}>New recipe</Button>} />
      <Input className="mb-4 max-w-xs" placeholder="Search…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
      <DAODataTable columns={columns} query={query} page={page} onPage={setPage} rowKey={(r) => r.id} onRowClick={(r) => navigate(`/recipes/${r.id}`)} />
    </>
  )
}
