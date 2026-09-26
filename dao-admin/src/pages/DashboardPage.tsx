import { useQuery } from '@tanstack/react-query'
import { Banknote, Eye, ShoppingBag, Star, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DAOAdminCard, DAOAdminHeader, DAOStatsCard, ErrorState, Field, Input, Select, TableSkeleton } from '@/components/ui'
import { api } from '@/lib/api'
import { money, num } from '@/lib/format'
import type { DashboardMetrics } from '@/types/api'

const RANGES = [['today', 'Today'], ['7d', '7 days'], ['30d', '30 days'], ['90d', '90 days'], ['custom', 'Custom']] as const
const TIER_COLORS = ['var(--color-sage)', 'var(--color-rose)', 'var(--color-gold)', 'var(--color-deep-sage)', 'var(--color-cocoa)']

export default function DashboardPage() {
  const [range, setRange] = useState<string>('30d')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const params = range === 'custom' ? { range, from, to } : { range }
  const q = useQuery({
    queryKey: ['dashboard', params],
    queryFn: () => api.get<DashboardMetrics>('/dashboard', params),
    enabled: range !== 'custom' || (!!from && !!to),
  })
  const d = q.data

  return (
    <>
      <DAOAdminHeader title="Dashboard" subtitle="A little world created by Dao — at a glance."
        actions={
          <div className="flex items-end gap-2">
            <Field label="Range"><Select value={range} onChange={(e) => setRange(e.target.value)}>{RANGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
            {range === 'custom' ? <><Field label="From"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field><Field label="To"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field></> : null}
          </div>
        } />
      {q.isError ? <ErrorState error={q.error} onRetry={() => void q.refetch()} /> : !d ? <TableSkeleton /> : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DAOStatsCard label="Revenue" value={money(d.revenue)} icon={<Banknote className="size-5" />} accent="gold" />
            <DAOStatsCard label="Orders" value={`${num(d.orders)} · ${num(d.paid_orders)} paid`} icon={<ShoppingBag className="size-5" />} />
            <DAOStatsCard label="Customers" value={num(d.customers)} icon={<Users className="size-5" />} />
            <DAOStatsCard label="New customers" value={num(d.new_customers)} icon={<UserPlus className="size-5" />} accent="rose" />
            <DAOStatsCard label="Pending orders" value={num(d.pending_orders)} icon={<ShoppingBag className="size-5" />} accent="rose" />
            <DAOStatsCard label="Points issued" value={num(d.points_issued)} icon={<Star className="size-5" />} accent="gold" />
            <DAOStatsCard label="Points redeemed" value={num(d.points_redeemed)} icon={<Star className="size-5" />} accent="gold" />
            <DAOStatsCard label="Video views" value={num(d.video_views)} icon={<Eye className="size-5" />} />
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            <DAOAdminCard title="Revenue" className="xl:col-span-2">
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={d.revenue_by_day.map((r) => ({ ...r, baht: r.revenue / 100 }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--color-ink-muted)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-muted)' }} />
                    <Tooltip formatter={(v: number) => `฿${v.toLocaleString()}`} />
                    <Bar dataKey="baht" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </DAOAdminCard>
            <DAOAdminCard title="Membership">
              <div className="h-72">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={d.membership_distribution} dataKey="members" nameKey="code" innerRadius={60} outerRadius={95} paddingAngle={2}>
                      {d.membership_distribution.map((_, i) => <Cell key={i} fill={TIER_COLORS[i % TIER_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1 text-sm">{d.membership_distribution.map((m, i) => <li key={m.code} className="flex justify-between"><span className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: TIER_COLORS[i % TIER_COLORS.length] }} />{m.code}</span><span>{num(m.members)}</span></li>)}</ul>
            </DAOAdminCard>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <DAOAdminCard title="Top products">
              {d.top_products.length === 0 ? <p className="text-sm text-ink-muted">No paid orders in this range.</p> : (
                <ul className="divide-y divide-line text-sm">{d.top_products.map((p) => <li key={p.product_id} className="flex justify-between py-2"><span>{p.name}</span><span className="text-ink-muted">{num(p.units)} sold · {money(p.revenue)}</span></li>)}</ul>
              )}
            </DAOAdminCard>
            <DAOAdminCard title="Low stock">
              {d.low_stock.length === 0 ? <p className="text-sm text-ink-muted">All variants are well stocked ✦</p> : (
                <ul className="divide-y divide-line text-sm">{d.low_stock.map((v) => <li key={v.variant_id} className="flex justify-between py-2"><span>{v.name} <span className="text-ink-muted">{v.label}</span></span><span className={v.stock === 0 ? 'text-danger' : 'text-gold'}>{v.stock} left</span></li>)}</ul>
              )}
            </DAOAdminCard>
          </div>
        </div>
      )}
    </>
  )
}
