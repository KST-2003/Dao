import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, DAOAdminHeader, DAODataTable, DAOStatusBadge, Select, useToast, type Column } from '@/components/ui'
import { api, errorMessage } from '@/lib/api'
import { date } from '@/lib/format'
import type { Paged } from '@/types/api'

interface Row { id: number; product: { id: number; name: string | null }; user: string | null; rating: number; body: string | null; photos: string[]; is_verified_purchase: boolean; status: string; report_count: number; created_at: string | null }

export default function ReviewsPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('pending')
  const query = useQuery({ queryKey: ['reviews', page, status], queryFn: () => api.page<Paged<Row>>('/reviews', { page, status: status || undefined }) })
  const moderate = useMutation({
    mutationFn: ({ id, s }: { id: number; s: 'approved' | 'rejected' }) => api.post(`/reviews/${id}/moderate`, { status: s }),
    onSuccess: () => { toast('Review updated'); void qc.invalidateQueries({ queryKey: ['reviews'] }) },
    onError: (e) => toast(errorMessage(e), 'error'),
  })
  const columns: Column<Row>[] = [
    { key: 'p', header: 'Product', render: (r) => r.product.name },
    { key: 'r', header: 'Rating', render: (r) => <span className="text-gold">{'✦'.repeat(r.rating)}</span> },
    { key: 'b', header: 'Review', render: (r) => <div className="max-w-md"><p>{r.body}</p>{r.photos.length ? <div className="mt-1 flex gap-1">{r.photos.map((p) => <img key={p} src={p} alt="" className="size-10 rounded object-cover" />)}</div> : null}</div> },
    { key: 'u', header: 'By', render: (r) => <span>{r.user}{r.is_verified_purchase ? <span className="ml-1 text-xs text-primary">verified</span> : null}</span> },
    { key: 'f', header: 'Reports', render: (r) => (r.report_count ? <span className="text-danger">{r.report_count}</span> : '0') },
    { key: 'd', header: 'Date', render: (r) => date(r.created_at) },
    { key: 's', header: 'Status', render: (r) => <DAOStatusBadge status={r.status} /> },
    { key: 'a', header: '', render: (r) => <div className="flex gap-2">
      {r.status !== 'approved' ? <Button size="sm" onClick={() => moderate.mutate({ id: r.id, s: 'approved' })}>Approve</Button> : null}
      {r.status !== 'rejected' ? <Button size="sm" variant="danger" onClick={() => moderate.mutate({ id: r.id, s: 'rejected' })}>Reject</Button> : null}
    </div> },
  ]
  return (
    <>
      <DAOAdminHeader title="Reviews" subtitle="Approving a verified-purchase review awards the configured review bonus (once)." />
      <Select className="mb-4 max-w-48" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="">All</option></Select>
      <DAODataTable columns={columns} query={query} page={page} onPage={setPage} rowKey={(r) => r.id} empty="No reviews waiting ✦" />
    </>
  )
}
