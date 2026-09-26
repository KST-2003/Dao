import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { DAOAdminCard, DAOAdminHeader, DAOStatusBadge, ErrorState, TableSkeleton } from '@/components/ui'
import { PointsAdjustForm } from '@/components/loyalty/PointsAdjustForm'
import { useAuth } from '@/auth/AuthProvider'
import { api } from '@/lib/api'
import { date, dateTime, money, num } from '@/lib/format'
import type { CustomerDetail } from '@/types/api'

export default function CustomerDetailPage() {
  const { id } = useParams()
  const { can } = useAuth()
  const q = useQuery({ queryKey: ['customer', id], queryFn: () => api.get<CustomerDetail>(`/customers/${id}`) })
  if (q.isPending) return <TableSkeleton />
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />
  const c = q.data
  const rows: [string, string][] = [
    ['Phone', c.phone ?? '—'], ['Email', c.email ?? '—'], ['Language', c.language], ['Country', c.country ?? '—'], ['Birthday', c.date_of_birth ?? '—'],
    ['Referral code', c.referral_code], ['Referred by', c.referred_by ? `${c.referred_by.display_name ?? ''} (${c.referred_by.referral_code})` : '—'],
    ['Registered', dateTime(c.registered_at)], ['Last active', dateTime(c.last_active_at)],
  ]
  return (
    <>
      <DAOAdminHeader title={c.name ?? `Customer #${c.id}`} subtitle={c.tier ? `✦ ${c.tier}` : undefined} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <DAOAdminCard><p className="text-xs uppercase text-ink-muted">DAO Points</p><p className="font-display text-3xl">{num(c.points)}</p></DAOAdminCard>
            <DAOAdminCard><p className="text-xs uppercase text-ink-muted">Orders</p><p className="font-display text-3xl">{num(c.orders_count)}</p></DAOAdminCard>
            <DAOAdminCard><p className="text-xs uppercase text-ink-muted">Lifetime spend</p><p className="font-display text-3xl">{money(c.lifetime_spend)}</p></DAOAdminCard>
          </div>
          <DAOAdminCard title="Recent orders">
            <ul className="divide-y divide-line text-sm">
              {c.recent_orders.length === 0 ? <li className="py-2 text-ink-muted">No orders yet.</li> : c.recent_orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2"><Link to={`/orders/${o.id}`} className="text-primary hover:underline">{o.order_number}</Link><span className="text-ink-muted">{date(o.placed_at)}</span><DAOStatusBadge status={o.status} /><span>{money(o.grand_total)}</span></li>
              ))}
            </ul>
          </DAOAdminCard>
          {can('loyalty.manage') ? <DAOAdminCard title="Adjust points"><PointsAdjustForm userId={c.id} onDone={() => void q.refetch()} /></DAOAdminCard> : null}
        </div>
        <div className="space-y-6">
          <DAOAdminCard title="Profile"><dl className="space-y-2 text-sm">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-ink-muted">{k}</dt><dd className="text-right">{v}</dd></div>)}</dl></DAOAdminCard>
          <DAOAdminCard title="Sign-in methods"><ul className="space-y-1 text-sm">{c.providers.map((p) => <li key={p.provider} className="flex justify-between"><span className="uppercase">{p.provider}</span><span className="text-ink-muted">{date(p.linked_at)}</span></li>)}</ul></DAOAdminCard>
        </div>
      </div>
    </>
  )
}
