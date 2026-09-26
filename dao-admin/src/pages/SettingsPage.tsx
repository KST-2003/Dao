import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Button, DAOAdminCard, DAOAdminHeader, ErrorState, Field, Input, TableSkeleton, useToast } from '@/components/ui'
import { api, errorMessage } from '@/lib/api'
import { toMajor, toMinor } from '@/lib/format'

type Settings = Record<string, unknown> & { 'payments.bank_transfer'?: Record<string, string> }
type Def = { key: string; label: string; kind: 'int' | 'money'; hint?: string }

const GROUPS: { title: string; items: Def[] }[] = [
  { title: 'Earning DAO Points', items: [
    { key: 'loyalty.signup_bonus', label: 'Signup bonus (points)', kind: 'int' },
    { key: 'loyalty.earn_spend_unit', label: 'Spend per earning unit', kind: 'money', hint: 'e.g. ฿100' },
    { key: 'loyalty.earn_points_per_unit', label: 'Points per unit', kind: 'int', hint: 'e.g. 1 point per ฿100' },
    { key: 'loyalty.review_bonus', label: 'Review bonus', kind: 'int' },
    { key: 'loyalty.photo_review_bonus', label: 'Extra for photo review', kind: 'int' },
    { key: 'loyalty.birthday_bonus', label: 'Birthday bonus', kind: 'int' },
    { key: 'loyalty.expiry_months', label: 'Points expire after (months)', kind: 'int', hint: '0 = never' },
  ] },
  { title: 'Redeeming DAO Points', items: [
    { key: 'loyalty.redeem_points_unit', label: 'Points per step', kind: 'int', hint: 'e.g. 100 points' },
    { key: 'loyalty.redeem_value_per_unit', label: 'Discount per step', kind: 'money', hint: 'e.g. ฿10' },
    { key: 'loyalty.redeem_min_points', label: 'Minimum points to redeem', kind: 'int' },
    { key: 'loyalty.redeem_max_percent', label: 'Max % of order payable with points', kind: 'int' },
  ] },
  { title: 'Referrals', items: [
    { key: 'referral.referrer_bonus', label: 'Referrer bonus (points)', kind: 'int' },
    { key: 'referral.referee_bonus', label: 'New member bonus (points)', kind: 'int' },
    { key: 'referral.min_order_total', label: 'Qualifying first order', kind: 'money', hint: 'Rewards are only issued after this paid order' },
  ] },
  { title: 'Shipping', items: [
    { key: 'shipping.standard_fee', label: 'Standard delivery fee', kind: 'money' },
    { key: 'shipping.express_fee', label: 'Express delivery fee', kind: 'money' },
    { key: 'shipping.free_threshold', label: 'Free standard delivery from', kind: 'money' },
  ] },
]

export default function SettingsPage() {
  const toast = useToast()
  const q = useQuery({ queryKey: ['settings'], queryFn: () => api.get<Settings>('/settings') })
  const [form, setForm] = useState<Record<string, string>>({})
  const [bank, setBank] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!q.data) return
    const f: Record<string, string> = {}
    GROUPS.flatMap((g) => g.items).forEach((d) => { const v = q.data[d.key] as number; f[d.key] = d.kind === 'money' ? toMajor(v) : String(v ?? '') })
    setForm(f)
    setBank({ bank_name: '', account_name: '', account_number: '', promptpay_id: '', ...(q.data['payments.bank_transfer'] ?? {}) })
  }, [q.data])

  const save = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = {}
      GROUPS.flatMap((g) => g.items).forEach((d) => {
        const [group, key] = d.key.split('.') as [string, string]
        const value = d.kind === 'money' ? toMinor(form[d.key]) : form[d.key] === '' ? null : Number(form[d.key])
        body[group] = { ...(body[group] as object), [key]: value }
      })
      body.payments = { bank_transfer: bank }
      return api.put('/settings', body)
    },
    onSuccess: () => { toast('Settings saved'); void q.refetch() },
    onError: (e) => toast(errorMessage(e), 'error'),
  })

  if (q.isPending) return <TableSkeleton />
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />

  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate() }}>
      <DAOAdminHeader title="Settings" subtitle="Business rules used by the API. Changes apply immediately and are audited." actions={<Button type="submit" loading={save.isPending}>Save settings</Button>} />
      <div className="grid gap-6 xl:grid-cols-2">
        {GROUPS.map((g) => (
          <DAOAdminCard key={g.title} title={g.title}>
            <div className="grid gap-4 sm:grid-cols-2">
              {g.items.map((d) => (
                <Field key={d.key} label={`${d.label}${d.kind === 'money' ? ' (฿)' : ''}`} hint={d.hint}>
                  <Input type="number" step={d.kind === 'money' ? '0.01' : '1'} min={0} value={form[d.key] ?? ''} onChange={(e) => setForm({ ...form, [d.key]: e.target.value })} />
                </Field>
              ))}
            </div>
          </DAOAdminCard>
        ))}
        <DAOAdminCard title="Bank transfer / PromptPay">
          <p className="mb-3 text-sm text-ink-muted">Bank transfer appears at checkout only when an account number or PromptPay ID is set.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[['bank_name', 'Bank'], ['account_name', 'Account name'], ['account_number', 'Account number'], ['promptpay_id', 'PromptPay ID']].map(([k, l]) => (
              <Field key={k} label={l}><Input value={bank[k!] ?? ''} onChange={(e) => setBank({ ...bank, [k!]: e.target.value })} /></Field>
            ))}
          </div>
        </DAOAdminCard>
      </div>
    </form>
  )
}
