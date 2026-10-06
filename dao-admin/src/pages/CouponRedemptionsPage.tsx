import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DAOAdminHeader, DAODataTable, DAOStatusBadge, type Column } from '@/components/ui'
import { api } from '@/lib/api'
import { dateTime, money } from '@/lib/format'
import type { CouponRedemption, Paged } from '@/types/api'

export default function CouponRedemptionsPage() {
  const { id } = useParams()
  const [page, setPage] = useState(1)
  const coupon = useQuery({ queryKey: ['coupon', id], queryFn: () => api.get<{ code: string }>(`/coupons/${id}`) })
  const query = useQuery({ queryKey: ['coupon-redemptions', id, page], queryFn: () => api.page<Paged<CouponRedemption>>(`/coupons/${id}/redemptions`, { page }) })

  const columns: Column<CouponRedemption>[] = [
    { key: 'customer', header: 'Customer', render: (r) => <Link to={`/customers/${r.customer.id}`} className="text-primary hover:underline">{r.customer.name ?? r.customer.phone ?? r.customer.email ?? `#${r.customer.id}`}</Link> },
    { key: 'order', header: 'Order', render: (r) => <Link to={`/orders/${r.order.id}`} className="text-primary hover:underline">{r.order.number}</Link> },
    { key: 'discount', header: 'Discount', render: (r) => money(r.discount_amount) },
    { key: 'date', header: 'Redeemed', render: (r) => dateTime(r.redeemed_at) },
    { key: 'status', header: 'Status', render: (r) => (r.released_at ? <DAOStatusBadge status="released" /> : <DAOStatusBadge status="active" />) },
  ]

  return (
    <>
      <DAOAdminHeader title={coupon.data ? `Redemptions · ${coupon.data.code}` : 'Redemptions'} subtitle="Every time a customer has used this code, and on which order." />
      <DAODataTable columns={columns} query={query} page={page} onPage={setPage} rowKey={(r) => r.id} />
    </>
  )
}
