import { useMutation } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button, DAOAdminCard, Field, Input, Toggle, useToast } from '@/components/ui'
import { api, errorMessage } from '@/lib/api'
import { toMajor, toMinor } from '@/lib/format'
import type { Variant } from '@/types/api'

type Draft = { sku: string; size: string; color: string; color_hex: string; price_override: string; initial_stock: string; low_stock_threshold: string; is_active: boolean }
const empty: Draft = { sku: '', size: '', color: '', color_hex: '#', price_override: '', initial_stock: '0', low_stock_threshold: '3', is_active: true }

/**
 * Size × color variants. Stock is shown read-only here: after creation, every stock change goes
 * through Inventory adjustments (reason + audit), never a silent overwrite.
 */
export function VariantsEditor({ productId, variants, onChanged }: { productId: number; variants: Variant[]; onChanged: () => void }) {
  const toast = useToast()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [editId, setEditId] = useState<number | null>(null)

  const save = useMutation({
    mutationFn: (d: Draft) => {
      const body = {
        sku: d.sku, size: d.size || null, color: d.color || null, color_hex: /^#[0-9A-Fa-f]{6}$/.test(d.color_hex) ? d.color_hex : null,
        price_override: toMinor(d.price_override), low_stock_threshold: Number(d.low_stock_threshold || 3), is_active: d.is_active,
      }
      return editId ? api.put(`/products/${productId}/variants/${editId}`, body) : api.post(`/products/${productId}/variants`, { ...body, initial_stock: Number(d.initial_stock || 0) })
    },
    onSuccess: () => { toast('Variant saved'); setDraft(null); setEditId(null); onChanged() },
    onError: (e) => toast(errorMessage(e), 'error'),
  })
  const remove = useMutation({ mutationFn: (vid: number) => api.del(`/products/${productId}/variants/${vid}`), onSuccess: onChanged })
  const set = (k: keyof Draft, v: string | boolean) => setDraft((d) => (d ? { ...d, [k]: v } : d))

  return (
    <DAOAdminCard title="Variants & stock" actions={<Button type="button" size="sm" variant="secondary" icon={<Plus className="size-4" />} onClick={() => { setEditId(null); setDraft(empty) }}>Add variant</Button>}>
      {variants.length === 0 && !draft ? <p className="text-sm text-ink-muted">Add at least one variant (size/color) before publishing.</p> : null}
      {variants.length > 0 ? (
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-ink-muted"><tr><th className="py-2">SKU</th><th>Color</th><th>Size</th><th>Price</th><th>Stock</th><th /></tr></thead>
          <tbody>
            {variants.map((v) => (
              <tr key={v.id} className="border-t border-line">
                <td className="py-2 font-mono text-xs">{v.sku}</td>
                <td><span className="inline-flex items-center gap-2">{v.color_hex ? <span className="size-3 rounded-full border border-line" style={{ background: v.color_hex }} /> : null}{v.color ?? '—'}</span></td>
                <td>{v.size ?? '—'}</td>
                <td>{v.price_override ? `฿${toMajor(v.price_override)}` : 'base'}</td>
                <td className={v.stock_quantity <= v.low_stock_threshold ? 'text-danger' : ''}>{v.stock_quantity}{v.is_active ? '' : ' (off)'}</td>
                <td className="space-x-3 text-right">
                  <button type="button" className="text-primary hover:underline" onClick={() => { setEditId(v.id); setDraft({ sku: v.sku, size: v.size ?? '', color: v.color ?? '', color_hex: v.color_hex ?? '#', price_override: toMajor(v.price_override), initial_stock: '0', low_stock_threshold: String(v.low_stock_threshold), is_active: v.is_active }) }}>Edit</button>
                  <button type="button" className="text-danger hover:underline" onClick={() => remove.mutate(v.id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {draft ? (
        <div className="mt-4 grid gap-3 rounded-xl bg-muted p-4 sm:grid-cols-4">
          <Field label="SKU *"><Input value={draft.sku} onChange={(e) => set('sku', e.target.value)} /></Field>
          <Field label="Color"><Input value={draft.color} onChange={(e) => set('color', e.target.value)} placeholder="Beige" /></Field>
          <Field label="Swatch"><Input value={draft.color_hex} onChange={(e) => set('color_hex', e.target.value)} placeholder="#E8DCC8" /></Field>
          <Field label="Size"><Input value={draft.size} onChange={(e) => set('size', e.target.value)} placeholder="M" /></Field>
          <Field label="Price override (฿)"><Input type="number" step="0.01" value={draft.price_override} onChange={(e) => set('price_override', e.target.value)} /></Field>
          {!editId ? <Field label="Initial stock"><Input type="number" min={0} value={draft.initial_stock} onChange={(e) => set('initial_stock', e.target.value)} /></Field> : null}
          <Field label="Low-stock alert at"><Input type="number" min={0} value={draft.low_stock_threshold} onChange={(e) => set('low_stock_threshold', e.target.value)} /></Field>
          <div className="flex items-end"><Toggle label="Active" checked={draft.is_active} onChange={(v) => set('is_active', v)} /></div>
          <div className="flex items-end justify-end gap-2 sm:col-span-4">
            <Button type="button" variant="secondary" onClick={() => setDraft(null)}>Cancel</Button>
            <Button type="button" onClick={() => save.mutate(draft)} loading={save.isPending} disabled={!draft.sku}>Save variant</Button>
          </div>
        </div>
      ) : null}
    </DAOAdminCard>
  )
}
