import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useState } from 'react'
import { Field, Input } from '@/components/ui'
import { api } from '@/lib/api'
import type { Paged, ProductRow } from '@/types/api'

/** Search-and-add product selector (collections, coupons, "shop this look", recipe ingredients). */
export function ProductPicker({ value, onChange, label = 'Products' }: { value: number[]; onChange: (ids: number[]) => void; label?: string }) {
  const [q, setQ] = useState('')
  const search = useQuery({ queryKey: ['product-search', q], queryFn: () => api.page<Paged<ProductRow>>('/products', { q, per_page: 8 }), enabled: q.length >= 2 })
  const selected = useQuery({
    queryKey: ['product-names', value],
    queryFn: async () => Promise.all(value.map((id) => api.get<{ id: number; display_name: string | null }>(`/products/${id}`).catch(() => ({ id, display_name: `#${id}` })))),
    enabled: value.length > 0,
  })
  const name = (id: number) => selected.data?.find((p) => p.id === id)?.display_name ?? `#${id}`

  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-2">
        {value.map((id, i) => (
          <span key={id} className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-xs text-primary">
            {i + 1}. {name(id)}
            <button type="button" aria-label={`Remove ${name(id)}`} onClick={() => onChange(value.filter((x) => x !== id))}><X className="size-3" /></button>
          </span>
        ))}
      </div>
      <Input placeholder="Search products by name or SKU…" value={q} onChange={(e) => setQ(e.target.value)} />
      {q.length >= 2 && search.data ? (
        <ul className="max-h-48 overflow-y-auto rounded-xl border border-line bg-surface text-sm">
          {search.data.data.filter((p) => !value.includes(p.id)).map((p) => (
            <li key={p.id}><button type="button" className="w-full px-3 py-2 text-left hover:bg-muted" onClick={() => { onChange([...value, p.id]); setQ('') }}>{p.name} <span className="text-ink-subtle">{p.sku}</span></button></li>
          ))}
        </ul>
      ) : null}
    </Field>
  )
}
