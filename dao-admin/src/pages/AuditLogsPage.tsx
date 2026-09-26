import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { DAOAdminHeader, DAODataTable, Input, type Column } from '@/components/ui'
import { api } from '@/lib/api'
import { dateTime } from '@/lib/format'
import type { Paged } from '@/types/api'

interface Row { id: number; admin: { id: number; name: string; email: string } | null; action: string; subject: string | null; changes: unknown; reason: string | null; ip: string | null; created_at: string | null }

export default function AuditLogsPage() {
  const [page, setPage] = useState(1)
  const [action, setAction] = useState('')
  const q = useQuery({ queryKey: ['audit', page, action], queryFn: () => api.page<Paged<Row>>('/audit-logs', { page, action: action || undefined }) })
  const columns: Column<Row>[] = [
    { key: 'd', header: 'When', render: (r) => dateTime(r.created_at) },
    { key: 'a', header: 'Admin', render: (r) => r.admin?.name ?? 'system' },
    { key: 'x', header: 'Action', render: (r) => <span className="font-mono text-xs">{r.action}</span> },
    { key: 's', header: 'Subject', render: (r) => r.subject ?? '—' },
    { key: 'r', header: 'Reason', render: (r) => r.reason ?? '' },
    { key: 'c', header: 'Changes', render: (r) => (r.changes ? <details><summary className="cursor-pointer text-primary">view</summary><pre className="mt-1 max-w-md overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(r.changes, null, 2)}</pre></details> : '') },
    { key: 'i', header: 'IP', render: (r) => <span className="text-xs text-ink-subtle">{r.ip}</span> },
  ]
  return (
    <>
      <DAOAdminHeader title="Audit logs" subtitle="Every admin write is recorded here and cannot be edited." />
      <Input className="mb-4 max-w-xs" placeholder="Filter by action (e.g. points.)" value={action} onChange={(e) => { setAction(e.target.value); setPage(1) }} />
      <DAODataTable columns={columns} query={q} page={page} onPage={setPage} rowKey={(r) => r.id} />
    </>
  )
}
