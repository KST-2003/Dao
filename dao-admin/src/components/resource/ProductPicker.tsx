import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui'
import { api } from '@/lib/api'
import type { Paged, ProductRow } from '@/types/api'

/** Search-and-add product selector (collections, coupons, "shop this look", recipe ingredients). */
export function ProductPicker({ value, onChange, label = 'Products', names }: { value: number[]; onChange: (ids: number[]) => void; label?: string; names?: Record<number, string> }) {
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<Record<number, string>>({})
  const search = useQuery({ queryKey: ['product-search', q], queryFn: () => api.page<Paged<ProductRow>>('/products', { q, per_page: 8 }), enabled: q.length >= 2 })
  const selected = useQuery({
    queryKey: ['product-names', value],
    queryFn: async () => Promise.all(value.map((id) => api.get<{ id: number; display_name: string | null }>(`/products/${id}`).catch(() => ({ id, display_name: `#${id}` })))),
    enabled: value.length > 0 && value.some((id) => !names?.[id] && !picked[id]),
  })
  const name = (id: number) => picked[id] ?? names?.[id] ?? selected.data?.find((p) => p.id === id)?.display_name ?? `#${id}`

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      <div className="rounded-xl border border-line bg-muted/40 p-2">
        <p className="mb-1 text-xs text-ink-subtle">Selected ({value.length})</p>
        {value.length === 0 ? <p className="text-xs text-ink-subtle">None yet — search below to add.</p> : (
          <ul className="space-y-1">
            {value.map((id, i) => (
              <li key={id} className="flex items-center justify-between gap-2 rounded-lg bg-primary-soft px-3 py-1.5 text-sm text-primary">
                <span className="truncate">{i + 1}. {name(id)}</span>
                <button type="button" aria-label={`Remove ${name(id)}`} className="shrink-0" onClick={() => onChange(value.filter((x) => x !== id))}><X className="size-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Input placeholder="Search products by name or SKU…" value={q} onChange={(e) => setQ(e.target.value)} />
      {q.length >= 2 && search.data ? (
        <ul className="max-h-48 overflow-y-auto rounded-xl border border-line bg-surface text-sm">
          {search.data.data.filter((p) => !value.includes(p.id)).map((p) => (
            <li key={p.id}><button type="button" className="w-full px-3 py-2 text-left hover:bg-muted" onClick={() => { setPicked((m) => ({ ...m, [p.id]: p.name ?? p.sku ?? `#${p.id}` })); onChange([...value, p.id]); setQ('') }}>{p.name} <span className="text-ink-subtle">{p.sku}</span></button></li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
