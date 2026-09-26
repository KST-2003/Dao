import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, DAOAdminCard, DAOAdminHeader, DAOConfirmDialog, DAOStatusBadge, ErrorState, Field, Input, Select, TableSkeleton, Toggle, useToast } from '@/components/ui'
import { useAuth } from '@/auth/AuthProvider'
import { api, errorMessage } from '@/lib/api'
import { dateTime, money, num } from '@/lib/format'
import type { OrderDetail } from '@/types/api'

type Dialog = null | 'status' | 'paid' | 'refund'

export default function OrderDetailPage() {
  const { id } = useParams()
  const { can } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const [dialog, setDialog] = useState<Dialog>(null)
  const [next, setNext] = useState('')
  const [note, setNote] = useState('')
  const [reference, setReference] = useState('')
  const [restock, setRestock] = useState(true)
  const [ship, setShip] = useState<{ carrier: string; tracking_number: string; tracking_url: string } | null>(null)
  const q = useQuery({ queryKey: ['order', id], queryFn: () => api.get<OrderDetail>(`/orders/${id}`) })
  const done = (msg: string) => () => { toast(msg); setDialog(null); setNote(''); void qc.invalidateQueries({ queryKey: ['order', id] }); void qc.invalidateQueries({ queryKey: ['orders'] }) }
  const onError = (e: unknown) => toast(errorMessage(e), 'error')
  const transition = useMutation({ mutationFn: () => api.post(`/orders/${id}/status`, { status: next, note: note || null }), onSuccess: done('Status updated'), onError })
  const markPaid = useMutation({ mutationFn: () => api.post(`/orders/${id}/mark-paid`, { reference: reference || null, note }), onSuccess: done('Payment confirmed — points awarded'), onError })
  const refund = useMutation({ mutationFn: () => api.post(`/orders/${id}/refund`, { restock, note }), onSuccess: done('Refunded — points reversed'), onError })
  const shipment = useMutation({ mutationFn: () => api.put(`/orders/${id}/shipment`, ship), onSuccess: () => { setShip(null); done('Tracking saved')() }, onError })

  if (q.isPending) return <TableSkeleton />
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />
  const o = q.data
  const manage = can('orders.manage')
  const a = o.shipping_address

  return (
    <>
      <DAOAdminHeader title={o.order_number} subtitle={`Placed ${dateTime(o.placed_at)}`}
        actions={<>
          <DAOStatusBadge status={o.status} /><DAOStatusBadge status={o.payment_status} />
          {manage && o.payment_status !== 'succeeded' && !['cancelled', 'refunded'].includes(o.status) && o.payment_method !== 'stripe' ? <Button variant="gold" onClick={() => setDialog('paid')}>Confirm payment</Button> : null}
          {manage && o.allowed_next.filter((s) => s !== 'refunded' && s !== 'paid').length ? <Button variant="secondary" onClick={() => { setNext(o.allowed_next.find((s) => s !== 'refunded' && s !== 'paid') ?? ''); setDialog('status') }}>Update status</Button> : null}
          {manage && o.payment_status === 'succeeded' && o.allowed_next.includes('refunded') ? <Button variant="danger" onClick={() => setDialog('refund')}>Refund</Button> : null}
        </>} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <DAOAdminCard title="Items">
            <ul className="divide-y divide-line">
              {o.items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-3 text-sm">
                  {i.image_url ? <img src={i.image_url} alt="" className="h-14 w-11 rounded-md object-cover" /> : <div className="h-14 w-11 rounded-md bg-muted" />}
                  <div className="flex-1"><p className="font-medium">{i.product_name}</p><p className="text-xs text-ink-subtle">{i.variant_label} · {i.sku}</p></div>
                  <span className="text-ink-muted">{money(i.unit_price)} × {i.quantity}</span>
                  <span className="w-24 text-right font-medium">{money(i.line_total)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
              {[['Subtotal', money(o.subtotal)], ['Member discount', `−${money(o.member_discount)}`], [`Coupon ${o.coupon_code ?? ''}`, `−${money(o.coupon_discount)}`], [`Points (${num(o.points_redeemed)})`, `−${money(o.points_discount)}`], ['Shipping', money(o.shipping_fee)]].map(([k, v]) => (
                <div key={k} className="flex justify-between text-ink-muted"><dt>{k}</dt><dd>{v}</dd></div>
              ))}
              <div className="flex justify-between pt-2 text-base font-semibold"><dt>Total</dt><dd>{money(o.grand_total, o.currency)}</dd></div>
              <div className="flex justify-between text-gold"><dt>DAO Points earned</dt><dd>+{num(o.points_earned)}</dd></div>
            </dl>
          </DAOAdminCard>
          <DAOAdminCard title="Timeline">
            <ol className="space-y-2 text-sm">
              {o.history.map((h) => <li key={h.id} className="flex justify-between gap-4"><span><DAOStatusBadge status={h.to_status} /> {h.note ? <span className="text-ink-muted">— {h.note}</span> : null}</span><span className="text-ink-subtle">{dateTime(h.created_at)}</span></li>)}
            </ol>
          </DAOAdminCard>
        </div>
        <div className="space-y-6">
          <DAOAdminCard title="Customer">
            {o.customer ? <div className="text-sm"><Link to={`/customers/${o.customer.id}`} className="font-medium text-primary hover:underline">{o.customer.display_name ?? o.customer.name ?? `#${o.customer.id}`}</Link><p className="text-ink-muted">{o.customer.phone}</p><p className="text-ink-muted">{o.customer.email}</p></div> : '—'}
          </DAOAdminCard>
          <DAOAdminCard title="Delivery">
            <p className="text-sm">{a.recipient_name} · {a.phone}</p>
            <p className="text-sm text-ink-muted">{[a.address_line1, a.address_line2, a.subdistrict, a.district, a.city, a.region, a.postal_code, a.country_code].filter(Boolean).join(', ')}</p>
            {a.notes ? <p className="mt-2 text-xs text-ink-subtle">Note: {a.notes}</p> : null}
            <p className="mt-3 text-xs uppercase tracking-wide text-ink-muted">{o.delivery_method}</p>
            <div className="mt-3 border-t border-line pt-3 text-sm">
              {o.shipment?.tracking_number ? <p>{o.shipment.carrier} · <span className="font-mono">{o.shipment.tracking_number}</span></p> : <p className="text-ink-muted">No tracking yet.</p>}
              {manage ? <Button size="sm" variant="ghost" onClick={() => setShip({ carrier: o.shipment?.carrier ?? '', tracking_number: o.shipment?.tracking_number ?? '', tracking_url: o.shipment?.tracking_url ?? '' })}>Edit tracking</Button> : null}
            </div>
          </DAOAdminCard>
          <DAOAdminCard title="Payments">
            <ul className="space-y-2 text-sm">{o.payments.map((p) => <li key={p.id} className="flex justify-between"><span>{p.provider} <span className="text-ink-subtle">{p.provider_reference}</span></span><DAOStatusBadge status={p.status} /></li>)}</ul>
            {o.notes ? <p className="mt-3 text-sm text-ink-muted">Customer note: {o.notes}</p> : null}
          </DAOAdminCard>
        </div>
      </div>

      <DAOConfirmDialog open={dialog === 'status'} title="Update status" loading={transition.isPending} onClose={() => setDialog(null)} onConfirm={() => transition.mutate()}>
        <Field label="New status"><Select value={next} onChange={(e) => setNext(e.target.value)}>{o.allowed_next.filter((s) => s !== 'refunded' && s !== 'paid').map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</Select></Field>
        <Field label="Note (optional)"><Input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </DAOConfirmDialog>
      <DAOConfirmDialog open={dialog === 'paid'} title="Confirm payment received" message="Marks the order paid, awards DAO Points and updates membership. Only do this after the money is in the account." confirmLabel="Confirm payment" loading={markPaid.isPending} onClose={() => setDialog(null)} onConfirm={() => markPaid.mutate()}>
        <Field label="Transfer reference"><Input value={reference} onChange={(e) => setReference(e.target.value)} /></Field>
        <Field label="Note (required)"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. KBank slip 14:02 checked" /></Field>
      </DAOConfirmDialog>
      <DAOConfirmDialog open={dialog === 'refund'} title="Refund this order" message="Earned DAO Points are reversed and redeemed points returned. Card payments are refunded at Stripe; other methods must be refunded manually." destructive confirmLabel="Refund" loading={refund.isPending} onClose={() => setDialog(null)} onConfirm={() => refund.mutate()}>
        <Toggle label="Return items to stock" checked={restock} onChange={setRestock} />
        <Field label="Reason (required)"><Input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </DAOConfirmDialog>
      <DAOConfirmDialog open={!!ship} title="Shipment tracking" confirmLabel="Save" loading={shipment.isPending} onClose={() => setShip(null)} onConfirm={() => shipment.mutate()}>
        <Field label="Carrier"><Input value={ship?.carrier ?? ''} onChange={(e) => setShip((s) => s && { ...s, carrier: e.target.value })} placeholder="Kerry, Flash, Thailand Post…" /></Field>
        <Field label="Tracking number"><Input value={ship?.tracking_number ?? ''} onChange={(e) => setShip((s) => s && { ...s, tracking_number: e.target.value })} /></Field>
        <Field label="Tracking URL"><Input value={ship?.tracking_url ?? ''} onChange={(e) => setShip((s) => s && { ...s, tracking_url: e.target.value })} /></Field>
      </DAOConfirmDialog>
    </>
  )
}
