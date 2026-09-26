import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  Button, DAOAdminCard, DAOAdminHeader, DAOConfirmDialog, DAODataTable, DAOImageUploader, Field, Input, Select, Toggle, TranslationTabs,
  useToast, type Column, type TranslatedField,
} from '@/components/ui'
import { api, ApiError, errorMessage } from '@/lib/api'
import { fromLocalInput, toLocalInput, toMajor, toMinor } from '@/lib/format'
import type { Paged, Translations } from '@/types/api'
import { ProductPicker } from './ProductPicker'

type Folder = Parameters<typeof DAOImageUploader>[0]['folder']

export type FieldDef =
  | { name: string; label: string; type: 'text' | 'number' | 'slug'; required?: boolean; hint?: string }
  | { name: string; label: string; type: 'money'; hint?: string }
  | { name: string; label: string; type: 'toggle' }
  | { name: string; label: string; type: 'select'; options: { value: string; label: string }[]; allowEmpty?: boolean }
  | { name: string; label: string; type: 'datetime' }
  | { name: string; label: string; type: 'image'; folder: Folder }
  | { name: string; label: string; type: 'products' }

export interface ResourceConfig<Row> {
  title: string
  subtitle?: string
  endpoint: string
  columns: Column<Row>[]
  fields: FieldDef[]
  translations?: TranslatedField[]
  defaults: Record<string, unknown>
  deleteLabel?: string
  extraFilters?: ReactNode
}

type Rec = Record<string, unknown> & { id?: number; translations?: Translations<string> }

/**
 * Config-driven list + create/edit for admin resources (categories, collections, tiers, rewards,
 * coupons, banners). Every write goes to the API, which validates and writes the audit log.
 */
export function ResourcePage<Row extends { id: number }>({ config }: { config: ResourceConfig<Row> }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Rec | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const list = useQuery({ queryKey: [config.endpoint, page], queryFn: () => api.page<Paged<Row>>(config.endpoint, { page }) })

  const open = async (row?: Row) => {
    if (!row) return setEditing({ ...config.defaults, translations: {} })
    const full = await api.get<Rec>(`${config.endpoint}/${row.id}`)
    setEditing(full)
  }

  const save = useMutation({
    mutationFn: (rec: Rec) => {
      const payload: Record<string, unknown> = {}
      for (const f of config.fields) {
        const v = rec[f.name]
        payload[f.name] = f.type === 'money' ? toMinor(v as string) : f.type === 'datetime' ? (v ? fromLocalInput(String(v)) : null) : f.type === 'number' ? (v === '' || v == null ? null : Number(v)) : v === '' ? null : v
      }
      if (config.translations) payload.translations = rec.translations ?? {}
      return rec.id ? api.put(`${config.endpoint}/${rec.id}`, payload) : api.post(config.endpoint, payload)
    },
    onSuccess: () => { toast('Saved'); setEditing(null); void qc.invalidateQueries({ queryKey: [config.endpoint] }) },
    onError: (e) => toast(errorMessage(e), 'error'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.del(`${config.endpoint}/${id}`),
    onSuccess: () => { toast('Done'); setConfirmDelete(false); setEditing(null); void qc.invalidateQueries({ queryKey: [config.endpoint] }) },
    onError: (e) => { toast(errorMessage(e), 'error'); setConfirmDelete(false) },
  })

  const err = (key: string) => (save.error instanceof ApiError ? save.error.field(key) : undefined)
  const set = (name: string, v: unknown) => setEditing((r) => (r ? { ...r, [name]: v } : r))
  const val = (f: FieldDef) => {
    const v = editing?.[f.name]
    if (f.type === 'money') return typeof v === 'number' ? toMajor(v) : ((v as string) ?? '')
    if (f.type === 'datetime') return typeof v === 'string' && v.includes('T') && v.length > 16 ? toLocalInput(v) : ((v as string) ?? '')
    return v
  }

  return (
    <>
      <DAOAdminHeader title={config.title} subtitle={config.subtitle} actions={<Button icon={<Plus className="size-4" />} onClick={() => void open()}>New</Button>} />
      {config.extraFilters}
      <DAODataTable columns={config.columns} query={list} page={page} onPage={setPage} rowKey={(r) => r.id} onRowClick={(r) => void open(r)} />

      {editing ? (
        <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal aria-label={config.title}>
          <button className="absolute inset-0 bg-black/30" aria-label="Close" onClick={() => setEditing(null)} />
          <form className="relative h-full w-full max-w-xl overflow-y-auto bg-bg p-6 shadow-[var(--shadow-card)]" onSubmit={(e) => { e.preventDefault(); save.mutate(editing) }}>
            <DAOAdminCard title={editing.id ? `Edit ${config.title.toLowerCase()}` : `New ${config.title.toLowerCase()}`}>
              <div className="grid gap-4">
                {config.fields.map((f) => {
                  if (f.type === 'toggle') return <Toggle key={f.name} label={f.label} checked={!!editing[f.name]} onChange={(v) => set(f.name, v)} />
                  if (f.type === 'image') return <DAOImageUploader key={f.name} label={f.label} folder={f.folder} value={(editing[f.name] as string) ?? null} onChange={(v) => set(f.name, v)} />
                  if (f.type === 'products') return <ProductPicker key={f.name} label={f.label} value={(editing[f.name] as number[]) ?? []} onChange={(v) => set(f.name, v)} />
                  if (f.type === 'select') return (
                    <Field key={f.name} label={f.label} error={err(f.name)}>
                      <Select value={(editing[f.name] as string) ?? ''} onChange={(e) => set(f.name, e.target.value || null)}>
                        {f.allowEmpty ? <option value="">—</option> : null}
                        {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </Select>
                    </Field>
                  )
                  return (
                    <Field key={f.name} label={`${f.label}${f.type === 'money' ? ' (฿)' : ''}${'required' in f && f.required ? ' *' : ''}`} error={err(f.name)} hint={'hint' in f ? f.hint : undefined}>
                      <Input type={f.type === 'datetime' ? 'datetime-local' : f.type === 'number' || f.type === 'money' ? 'number' : 'text'} step={f.type === 'money' ? '0.01' : undefined}
                        value={(val(f) as string | number | undefined) ?? ''} onChange={(e) => set(f.name, e.target.value)} />
                    </Field>
                  )
                })}
                {config.translations ? (
                  <TranslationTabs fields={config.translations} value={editing.translations ?? {}} onChange={(t) => set('translations', t)} errors={err} />
                ) : null}
              </div>
              <div className="mt-6 flex justify-between gap-2">
                {editing.id ? <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>{config.deleteLabel ?? 'Delete'}</Button> : <span />}
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
                  <Button type="submit" loading={save.isPending}>Save</Button>
                </div>
              </div>
            </DAOAdminCard>
          </form>
        </div>
      ) : null}
      <DAOConfirmDialog open={confirmDelete} title={`${config.deleteLabel ?? 'Delete'}?`} message="This change is recorded in the audit log." destructive
        loading={remove.isPending} onClose={() => setConfirmDelete(false)} onConfirm={() => editing?.id && remove.mutate(editing.id)} />
    </>
  )
}
