import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, DAOAdminCard, DAOAdminHeader, DAOConfirmDialog, DAOStatusBadge, ErrorState, Field, Input, Select, TableSkeleton, useToast } from '@/components/ui'
import { useAuth } from '@/auth/AuthProvider'
import { api, errorMessage } from '@/lib/api'
import { dateTime, money, toMinor } from '@/lib/format'
import type { PreorderDetail } from '@/types/api'

type Dialog = null | 'status' | 'paid' | 'refund'
const TRACKING = ['waiting_courier', 'in_transit', 'landed_myanmar', 'packaging', 'on_delivery']

export default function PreorderDetailPage() {
  const { id } = useParams()
  const { can } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const [dialog, setDialog] = useState<Dialog>(null)
  const [next, setNext] = useState('')
  const [note, setNote] = useState('')
  const [fee, setFee] = useState('')
  const [carrier, setCarrier] = useState('')
  const [tracking, setTracking] = useState('')
  const [reference, setReference] = useState('')
  const q = useQuery({ queryKey: ['preorder', id], queryFn: () => api.get<PreorderDetail>(`/preorders/${id}`) })
  const done = (msg: string) => () => {
    toast(msg); setDialog(null); setNote(''); setFee('')
    void qc.invalidateQueries({ queryKey: ['preorder', id] }); void qc.invalidateQueries({ queryKey: ['preorders'] })
  }
  const onError = (e: unknown) => toast(errorMessage(e), 'error')
  const transition = useMutation({
    mutationFn: () => api.post(`/preorders/${id}/status`, {
      status: next, note: note || null, shipping_fee: next === 'waiting_payment' ? (toMinor(fee) ?? 0) : null,
      carrier: carrier || null, tracking_number: tracking || null,
    }),
    onSuccess: done('Status updated — customer notified'), onError,
  })
  const markPaid = useMutation({ mutationFn: () => api.post(`/preorders/${id}/mark-paid`, { reference: reference || null, note }), onSuccess: done('Payment confirmed — pre-order is in process'), onError })
  const refund = useMutation({ mutationFn: () => api.post(`/preorders/${id}/refund`, { note }), onSuccess: done('Refunded — points reversed'), onError })

  if (q.isPending) return <TableSkeleton />
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />
  const p = q.data
  const manage = can('orders.manage')
  const a = p.shipping_address
  // Payment is confirmed through "Confirm payment"; the backend then starts processing.
  const moves = p.allowed_next
  const stepIndex = p.steps.indexOf(p.status)
  const openStatus = (s: string) => { setNext(s); setCarrier(p.carrier ?? ''); setTracking(p.tracking_number ?? ''); setNote(''); setDialog('status') }

  return (
    <>
      <DAOAdminHeader title={p.preorder_number} subtitle={`Submitted ${dateTime(p.submitted_at)} · ships to ${p.destination}`}
        actions={<>
          <DAOStatusBadge status={p.status} />
          {manage && p.can_mark_paid ? <Button variant="gold" onClick={() => setDialog('paid')}>Confirm payment</Button> : null}
          {manage && moves.length ? <Button variant="secondary" onClick={() => openStatus(moves.find((s) => s !== 'cancelled') ?? moves[0]!)}>Update status</Button> : null}
          {manage && p.can_refund ? <Button variant="danger" onClick={() => setDialog('refund')}>Refund</Button> : null}
        </>} />

      <DAOAdminCard title="Progress">
        <ol className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {p.steps.map((s, i) => (
            <li key={s} className={`flex items-center gap-1.5 ${i <= stepIndex ? 'font-medium text-primary' : 'text-ink-subtle'}`}>
              {i <= stepIndex ? <Check className="size-4" /> : <span className="size-4 rounded-full border border-line" />}{s.replace(/_/g, ' ')}
            </li>
          ))}
        </ol>
        {['rejected', 'cancelled', 'refunded'].includes(p.status) ? <p className="mt-3 text-sm text-danger">This pre-order is {p.status}.{p.reject_reason ? ` Reason: ${p.reject_reason}` : ''}</p> : null}
      </DAOAdminCard>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <DAOAdminCard title="Items">
            <ul className="divide-y divide-line">
              {p.items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-3 text-sm">
                  {i.image_url ? <img src={i.image_url} alt="" className="h-14 w-11 rounded-md object-cover" /> : <div className="h-14 w-11 rounded-md bg-muted" />}
                  <div className="flex-1"><p className="font-medium">{i.product_name}</p><p className="text-xs text-ink-subtle">{i.variant_label} · {i.sku}</p></div>
                  <span className="text-ink-muted">{money(i.unit_price)} × {i.quantity}</span>
                  <span className="w-24 text-right font-medium">{money(i.line_total)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
              {[['Subtotal', money(p.subtotal)], ['Member discount', `−${money(p.member_discount)}`], ['Shipping', p.order ? money(p.shipping_fee) : 'Set when moving to waiting payment']].map(([k, v]) => (
                <div key={k} className="flex justify-between text-ink-muted"><dt>{k}</dt><dd>{v}</dd></div>
              ))}
              <div className="flex justify-between pt-2 text-base font-semibold"><dt>{p.order ? 'Total' : 'Estimated total'}</dt><dd>{money(p.grand_total, p.currency)}</dd></div>
            </dl>
          </DAOAdminCard>
          <DAOAdminCard title="Timeline">
            <ol className="space-y-2 text-sm">
              {p.history.map((h) => <li key={h.id} className="flex justify-between gap-4"><span><DAOStatusBadge status={h.to_status} /> {h.note ? <span className="text-ink-muted">— {h.note}</span> : null}</span><span className="text-ink-subtle">{dateTime(h.created_at)}</span></li>)}
            </ol>
          </DAOAdminCard>
        </div>
        <div className="space-y-6">
          <DAOAdminCard title="Customer">
            {p.customer ? <div className="text-sm"><Link to={`/customers/${p.customer.id}`} className="font-medium text-primary hover:underline">{p.customer.display_name ?? p.customer.name ?? `#${p.customer.id}`}</Link><p className="text-ink-muted">{p.customer.phone}</p><p className="text-ink-muted">{p.customer.email}</p></div> : '—'}
          </DAOAdminCard>
          <DAOAdminCard title="Delivery">
            <p className="text-sm">{a.recipient_name} · {a.phone}</p>
            <p className="text-sm text-ink-muted">{[a.address_line1, a.address_line2, a.subdistrict, a.district, a.city, a.region, a.postal_code, a.country_code].filter(Boolean).join(', ')}</p>
            {a.notes ? <p className="mt-2 text-xs text-ink-subtle">Note: {a.notes}</p> : null}
            <div className="mt-3 border-t border-line pt-3 text-sm">
              {p.tracking_number ? <p>{p.carrier} · <span className="font-mono">{p.tracking_number}</span></p> : <p className="text-ink-muted">No tracking yet.</p>}
            </div>
            {p.notes ? <p className="mt-3 text-sm text-ink-muted">Customer note: {p.notes}</p> : null}
          </DAOAdminCard>
          <DAOAdminCard title="Payment">
            {p.order ? (
              <div className="space-y-2 text-sm">
                <p>Order <Link to={`/orders/${p.order.id}`} className="font-medium text-primary hover:underline">{p.order.order_number}</Link> · {p.order.payment_method}</p>
                <ul className="space-y-1">{p.order.payments.map((x) => <li key={x.id} className="flex justify-between"><span>{x.provider} <span className="text-ink-subtle">{x.provider_reference}</span></span><DAOStatusBadge status={x.status} /></li>)}</ul>
              </div>
            ) : <p className="text-sm text-ink-muted">A payable order is created when the status becomes waiting payment.</p>}
          </DAOAdminCard>
        </div>
      </div>

      <DAOConfirmDialog open={dialog === 'status'} title="Update status" loading={transition.isPending} onClose={() => setDialog(null)} onConfirm={() => transition.mutate()}>
        <Field label="New status"><Select value={next} onChange={(e) => setNext(e.target.value)}>{moves.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}</Select></Field>
        {next === 'waiting_payment' ? <Field label="Shipping fee (฿)" hint="Added to the total the customer pays. Leave empty for free shipping."><Input type="number" step="0.01" min="0" value={fee} onChange={(e) => setFee(e.target.value)} /></Field> : null}
        {TRACKING.includes(next) ? <>
          <Field label="Carrier (optional)"><Input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="Courier, Flash, Thailand Post…" /></Field>
          <Field label="Tracking number (optional)"><Input value={tracking} onChange={(e) => setTracking(e.target.value)} /></Field>
        </> : null}
        <Field label={next === 'rejected' ? 'Reason shown to the customer (required)' : 'Note (optional)'}><Input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </DAOConfirmDialog>
      <DAOConfirmDialog open={dialog === 'paid'} title="Confirm payment received" message="Marks the payable order paid, awards DAO Points and starts processing. Only do this after the money is in the account." confirmLabel="Confirm payment" loading={markPaid.isPending} onClose={() => setDialog(null)} onConfirm={() => markPaid.mutate()}>
        <Field label="Transfer reference"><Input value={reference} onChange={(e) => setReference(e.target.value)} /></Field>
        <Field label="Note (required)"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. KBank slip 14:02 checked" /></Field>
      </DAOConfirmDialog>
      <DAOConfirmDialog open={dialog === 'refund'} title="Refund this pre-order" message="Earned DAO Points are reversed. Card payments are refunded at Stripe; other methods must be refunded manually. Stock is not changed." destructive confirmLabel="Refund" loading={refund.isPending} onClose={() => setDialog(null)} onConfirm={() => refund.mutate()}>
        <Field label="Reason (required)"><Input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </DAOConfirmDialog>
    </>
  )
}
