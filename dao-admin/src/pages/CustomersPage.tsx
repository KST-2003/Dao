import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DAOAdminHeader, DAODataTable, Input, type Column } from '@/components/ui'
import { api } from '@/lib/api'
import { date, money, num } from '@/lib/format'
import type { CustomerRow, Paged } from '@/types/api'

export default function CustomersPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const query = useQuery({ queryKey: ['customers', page, q], queryFn: () => api.page<Paged<CustomerRow>>('/customers', { page, q: q || undefined }) })
  const columns: Column<CustomerRow>[] = [
    { key: 'n', header: 'Customer', render: (c) => <div><p className="font-medium">{c.name ?? '—'}{c.deleted ? ' (deleted)' : ''}</p><p className="text-xs text-ink-subtle">{c.phone ?? c.email ?? ''}</p></div> },
    { key: 'l', header: 'Lang', render: (c) => c.language.toUpperCase() },
    { key: 't', header: 'Tier', render: (c) => (c.tier ? <span className="text-gold">✦ {c.tier}</span> : '—') },
    { key: 'p', header: 'Points', render: (c) => num(c.points) },
    { key: 'o', header: 'Orders', render: (c) => num(c.orders_count) },
    { key: 's', header: 'Spent', render: (c) => money(c.total_spent) },
    { key: 'r', header: 'Joined', render: (c) => date(c.registered_at) },
    { key: 'a', header: 'Last active', render: (c) => date(c.last_active_at) },
  ]
  return (
    <>
      <DAOAdminHeader title="Customers" subtitle="Authentication credentials are never visible here — only which sign-in methods are linked." />
      <Input className="mb-4 max-w-xs" placeholder="Name, phone or email…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
      <DAODataTable columns={columns} query={query} page={page} onPage={setPage} rowKey={(c) => c.id} onRowClick={(c) => navigate(`/customers/${c.id}`)} />
    </>
  )
}
