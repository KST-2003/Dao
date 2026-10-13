import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DAOAdminHeader, DAODataTable, DAOStatusBadge, Input, Select, type Column } from '@/components/ui'
import { api } from '@/lib/api'
import { dateTime, money } from '@/lib/format'
import type { Paged, PreorderRow } from '@/types/api'

export const PREORDER_STATUSES = [
  'submitted', 'in_review', 'approved', 'rejected', 'waiting_payment', 'in_process', 'waiting_courier', 'in_transit',
  'landed_myanmar', 'packaging', 'on_delivery', 'completed', 'cancelled', 'refunded',
]

export default function PreordersPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [destination, setDestination] = useState('')
  const query = useQuery({
    queryKey: ['preorders', page, q, status, destination],
    queryFn: () => api.page<Paged<PreorderRow>>('/preorders', { page, q: q || undefined, status: status || undefined, destination: destination || undefined }),
  })
  const columns: Column<PreorderRow>[] = [
    { key: 'n', header: 'Pre-order', render: (p) => <span className="font-medium">{p.preorder_number}</span> },
    { key: 'c', header: 'Customer', render: (p) => p.customer ?? '—' },
    { key: 'd', header: 'Submitted', render: (p) => dateTime(p.submitted_at) },
    { key: 'i', header: 'Items', render: (p) => p.items_count },
    { key: 'to', header: 'Ship to', render: (p) => <span className="capitalize">{p.destination}</span> },
    { key: 't', header: 'Total', render: (p) => money(p.grand_total, p.currency) },
    { key: 's', header: 'Status', render: (p) => <DAOStatusBadge status={p.status} /> },
  ]
  return (
    <>
      <DAOAdminHeader title="Pre-orders" subtitle="Review, approve and track pre-orders from submission to delivery." />
      <div className="mb-4 flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Pre-order number, phone or email…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
        <Select className="max-w-52" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All statuses</option>{PREORDER_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </Select>
        <Select className="max-w-44" value={destination} onChange={(e) => { setDestination(e.target.value); setPage(1) }}>
          <option value="">Thailand + Myanmar</option><option value="thailand">Thailand</option><option value="myanmar">Myanmar</option>
        </Select>
      </div>
      <DAODataTable columns={columns} query={query} page={page} onPage={setPage} rowKey={(p) => p.id} onRowClick={(p) => navigate(`/preorders/${p.id}`)} />
    </>
  )
}
