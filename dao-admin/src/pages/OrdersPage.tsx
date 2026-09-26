import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DAOAdminHeader, DAODataTable, DAOStatusBadge, Input, Select, type Column } from '@/components/ui'
import { api } from '@/lib/api'
import { dateTime, money } from '@/lib/format'
import type { OrderRow, Paged } from '@/types/api'

export const ORDER_STATUSES = ['pending_payment', 'paid', 'processing', 'packing', 'shipped', 'delivered', 'cancelled', 'refunded']

export default function OrdersPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const query = useQuery({ queryKey: ['orders', page, q, status, from, to], queryFn: () => api.page<Paged<OrderRow>>('/orders', { page, q: q || undefined, status: status || undefined, from: from || undefined, to: to || undefined }) })
  const columns: Column<OrderRow>[] = [
    { key: 'n', header: 'Order', render: (o) => <span className="font-medium">{o.order_number}</span> },
    { key: 'c', header: 'Customer', render: (o) => o.customer ?? '—' },
    { key: 'd', header: 'Placed', render: (o) => dateTime(o.placed_at) },
    { key: 'i', header: 'Items', render: (o) => o.items_count },
    { key: 't', header: 'Total', render: (o) => money(o.grand_total, o.currency) },
    { key: 'p', header: 'Payment', render: (o) => <span className="flex flex-col gap-1"><DAOStatusBadge status={o.payment_status} /><span className="text-xs text-ink-subtle">{o.payment_method}</span></span> },
    { key: 's', header: 'Status', render: (o) => <DAOStatusBadge status={o.status} /> },
  ]
  return (
    <>
      <DAOAdminHeader title="Orders" />
      <div className="mb-4 flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Order number, phone or email…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
        <Select className="max-w-48" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All statuses</option>{ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </Select>
        <Input type="date" className="max-w-40" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" />
        <Input type="date" className="max-w-40" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" />
      </div>
      <DAODataTable columns={columns} query={query} page={page} onPage={setPage} rowKey={(o) => o.id} onRowClick={(o) => navigate(`/orders/${o.id}`)} />
    </>
  )
}
