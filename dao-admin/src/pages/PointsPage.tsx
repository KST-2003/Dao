import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PointsAdjustForm } from '@/components/loyalty/PointsAdjustForm'
import { Button, DAOAdminCard, DAOAdminHeader, DAODataTable, Field, Input, Select, useToast, type Column } from '@/components/ui'
import { api, errorMessage } from '@/lib/api'
import { dateTime, num } from '@/lib/format'
import type { LedgerRow, Paged } from '@/types/api'

const TYPES = ['purchase_earned', 'signup_bonus', 'review_bonus', 'birthday_bonus', 'referral_bonus', 'campaign_bonus', 'manual_adjustment', 'redeemed', 'redemption_reversal', 'expired', 'refund_reversal']

export default function PointsPage() {
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [type, setType] = useState('')
  const [userId, setUserId] = useState('')
  const [campaign, setCampaign] = useState({ code: '', points: '', description: '' })
  const ledger = useQuery({ queryKey: ['ledger', page, type, userId], queryFn: () => api.page<Paged<LedgerRow>>('/points/ledger', { page, type: type || undefined, user_id: userId || undefined }) })
  const run = useMutation({
    mutationFn: () => api.post('/points/campaigns', { code: campaign.code, points: Number(campaign.points), description: campaign.description }),
    onSuccess: () => { toast('Campaign queued — members receive points shortly'); setCampaign({ code: '', points: '', description: '' }) },
    onError: (e) => toast(errorMessage(e), 'error'),
  })
  const columns: Column<LedgerRow>[] = [
    { key: 'd', header: 'When', render: (r) => dateTime(r.created_at) },
    { key: 'u', header: 'Customer', render: (r) => (r.user ? <Link className="text-primary hover:underline" to={`/customers/${r.user.id}`}>{r.user.name ?? `#${r.user.id}`}</Link> : '—') },
    { key: 't', header: 'Type', render: (r) => r.type.replace(/_/g, ' ') },
    { key: 'p', header: 'Points', render: (r) => <span className={r.points > 0 ? 'text-gold' : 'text-ink-muted'}>{r.points > 0 ? '+' : ''}{num(r.points)}</span> },
    { key: 'b', header: 'Balance', render: (r) => num(r.balance_after) },
    { key: 'x', header: 'Description', render: (r) => <span className="text-ink-muted">{r.description}{r.admin ? ` · by ${r.admin}` : ''}</span> },
  ]
  return (
    <>
      <DAOAdminHeader title="DAO Points" subtitle="Append-only ledger. Balances are derived from it and reconciled nightly. Earning & redemption rules live in Settings." />
      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <DAOAdminCard title="Manual adjustment"><PointsAdjustForm /></DAOAdminCard>
        <DAOAdminCard title="Campaign bonus (all members)">
          <form className="grid gap-3 sm:grid-cols-4" onSubmit={(e) => { e.preventDefault(); run.mutate() }}>
            <Field label="Code"><Input required value={campaign.code} onChange={(e) => setCampaign({ ...campaign, code: e.target.value })} placeholder="songkran-2027" /></Field>
            <Field label="Points"><Input type="number" min={1} required value={campaign.points} onChange={(e) => setCampaign({ ...campaign, points: e.target.value })} /></Field>
            <Field label="Description"><Input required value={campaign.description} onChange={(e) => setCampaign({ ...campaign, description: e.target.value })} /></Field>
            <div className="flex items-end"><Button type="submit" variant="gold" loading={run.isPending}>Send</Button></div>
          </form>
          <p className="mt-2 text-xs text-ink-subtle">Each member can receive a campaign code only once (idempotent).</p>
        </DAOAdminCard>
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        <Select className="max-w-56" value={type} onChange={(e) => { setType(e.target.value); setPage(1) }}><option value="">All types</option>{TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}</Select>
        <Input className="max-w-40" type="number" placeholder="Customer ID" value={userId} onChange={(e) => { setUserId(e.target.value); setPage(1) }} />
      </div>
      <DAODataTable columns={columns} query={ledger} page={page} onPage={setPage} rowKey={(r) => r.id} />
    </>
  )
}
