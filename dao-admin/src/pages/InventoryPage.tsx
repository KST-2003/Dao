import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { DAOAdminHeader, DAOConfirmDialog, DAODataTable, Field, Input, Select, Toggle, useToast, type Column } from '@/components/ui'
import { api, errorMessage } from '@/lib/api'
import type { Paged } from '@/types/api'

interface Row { id: number; product_id: number; product_name: string | null; sku: string; label: string; stock_quantity: number; low_stock_threshold: number; is_low: boolean; is_active: boolean }

/** Variant stock. Every change is a ledger movement with a reason and appears in the audit log. */
export default function InventoryPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [low, setLow] = useState(false)
  const [target, setTarget] = useState<Row | null>(null)
  const [change, setChange] = useState('')
  const [reason, setReason] = useState('restock')
  const [note, setNote] = useState('')
  const query = useQuery({ queryKey: ['inventory', page, q, low], queryFn: () => api.page<Paged<Row>>('/inventory', { page, q: q || undefined, low_stock: low ? 1 : undefined }) })
  const adjust = useMutation({
    mutationFn: () => api.post('/inventory/adjust', { variant_id: target!.id, change: Number(change), reason, note }),
    onSuccess: () => { toast('Stock updated'); setTarget(null); setChange(''); setNote(''); void qc.invalidateQueries({ queryKey: ['inventory'] }) },
    onError: (e) => toast(errorMessage(e), 'error'),
  })
  const columns: Column<Row>[] = [
    { key: 'p', header: 'Product', render: (r) => <div><p className="font-medium">{r.product_name}</p><p className="text-xs text-ink-subtle">{r.label || '—'}</p></div> },
    { key: 'sku', header: 'SKU', render: (r) => <span className="font-mono text-xs">{r.sku}</span> },
    { key: 'stock', header: 'Stock', render: (r) => <span className={r.stock_quantity === 0 ? 'font-semibold text-danger' : r.is_low ? 'text-gold' : ''}>{r.stock_quantity}</span> },
    { key: 'alert', header: 'Alert at', render: (r) => r.low_stock_threshold },
    { key: 'a', header: '', render: (r) => <button className="text-primary hover:underline" onClick={(e) => { e.stopPropagation(); setTarget(r) }}>Adjust</button> },
  ]
  return (
    <>
      <DAOAdminHeader title="Inventory" subtitle="Stock lives on each size × color variant." />
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <Input className="max-w-xs" placeholder="Search product or SKU…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
        <Toggle label="Low stock only" checked={low} onChange={(v) => { setLow(v); setPage(1) }} />
      </div>
      <DAODataTable columns={columns} query={query} page={page} onPage={setPage} rowKey={(r) => r.id} />
      <DAOConfirmDialog open={!!target} title={`Adjust ${target?.sku ?? ''}`} message={`Current stock: ${target?.stock_quantity ?? 0}`} confirmLabel="Apply"
        loading={adjust.isPending} onClose={() => setTarget(null)} onConfirm={() => adjust.mutate()}>
        <Field label="Change (+ to add, − to remove)"><Input type="number" value={change} onChange={(e) => setChange(e.target.value)} placeholder="+10 or -2" /></Field>
        <Field label="Reason"><Select value={reason} onChange={(e) => setReason(e.target.value)}><option value="restock">Restock</option><option value="adjustment">Stock count adjustment</option><option value="damaged">Damaged / lost</option></Select></Field>
        <Field label="Note (required)"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Supplier delivery #1042" /></Field>
      </DAOConfirmDialog>
    </>
  )
}
