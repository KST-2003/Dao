import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, DAOAdminHeader, DAODataTable, DAOStatusBadge, Input, Select, type Column } from '@/components/ui'
import { api } from '@/lib/api'
import { money, num } from '@/lib/format'
import type { Paged, ProductRow } from '@/types/api'

export default function ProductsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const query = useQuery({ queryKey: ['products', page, q, status], queryFn: () => api.page<Paged<ProductRow>>('/products', { page, q: q || undefined, status: status || undefined }) })

  const columns: Column<ProductRow>[] = [
    { key: 'img', header: '', render: (p) => (p.image_url ? <img src={p.image_url} alt="" className="h-14 w-11 rounded-md object-cover" /> : <div className="h-14 w-11 rounded-md bg-muted" />) },
    { key: 'name', header: 'Product', render: (p) => <div><p className="font-medium">{p.name ?? p.slug}</p><p className="text-xs text-ink-subtle">{p.sku ?? '—'} · {p.category ?? 'Uncategorized'}</p></div> },
    { key: 'price', header: 'Price', render: (p) => (p.sale_price ? <><span className="text-danger">{money(p.sale_price)}</span> <s className="text-xs text-ink-subtle">{money(p.price)}</s></> : money(p.price)) },
    { key: 'stock', header: 'Stock', render: (p) => <span className={p.stock === 0 ? 'text-danger' : ''}>{num(p.stock)} <span className="text-xs text-ink-subtle">/ {p.variant_count} variants</span></span> },
    { key: 'badges', header: 'Badges', render: (p) => p.badges.join(', ') || '—' },
    { key: 'status', header: 'Status', render: (p) => <DAOStatusBadge status={p.status} /> },
  ]

  return (
    <>
      <DAOAdminHeader title="Products" subtitle="Fashion first. Every product is sold by variant (size × color) with its own stock."
        actions={<Button icon={<Plus className="size-4" />} onClick={() => navigate('/products/new')}>New product</Button>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <Input placeholder="Search name or SKU…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} className="max-w-xs" />
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="max-w-44">
          <option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
        </Select>
      </div>
      <DAODataTable columns={columns} query={query} page={page} onPage={setPage} rowKey={(p) => p.id} onRowClick={(p) => navigate(`/products/${p.id}`)} empty="No products yet — create the first piece of the DAO edit." />
    </>
  )
}
