import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button, DAOAdminHeader, DAOConfirmDialog, DAODataTable, DAOStatusBadge, Field, Input, Select, Toggle, useToast, type Column } from '@/components/ui'
import { api, errorMessage } from '@/lib/api'
import { dateTime } from '@/lib/format'
import type { Paged } from '@/types/api'

interface Row { id: number; name: string; email: string; is_active: boolean; role: { id: number; slug: string; name: string } | null; last_login_at: string | null }
interface Role { id: number; slug: string; name: string; permissions: string[] }
type Draft = { id?: number; name: string; email: string; password: string; admin_role_id: string; is_active: boolean }

export default function AdminUsersPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [draft, setDraft] = useState<Draft | null>(null)
  const users = useQuery({ queryKey: ['admin-users', page], queryFn: () => api.page<Paged<Row>>('/admin-users', { page }) })
  const roles = useQuery({ queryKey: ['admin-roles'], queryFn: () => api.get<Role[]>('/admin-roles') })
  const save = useMutation({
    mutationFn: (d: Draft) => {
      const body = { name: d.name, email: d.email, admin_role_id: Number(d.admin_role_id), is_active: d.is_active, ...(d.password ? { password: d.password } : {}) }
      return d.id ? api.put(`/admin-users/${d.id}`, body) : api.post('/admin-users', body)
    },
    onSuccess: () => { toast('Admin saved'); setDraft(null); void qc.invalidateQueries({ queryKey: ['admin-users'] }) },
    onError: (e) => toast(errorMessage(e), 'error'),
  })
  const columns: Column<Row>[] = [
    { key: 'n', header: 'Name', render: (u) => <div><p className="font-medium">{u.name}</p><p className="text-xs text-ink-subtle">{u.email}</p></div> },
    { key: 'r', header: 'Role', render: (u) => u.role?.name ?? '—' },
    { key: 'l', header: 'Last login', render: (u) => dateTime(u.last_login_at) },
    { key: 's', header: 'Status', render: (u) => <DAOStatusBadge status={u.is_active ? 'active' : 'inactive'} /> },
  ]
  return (
    <>
      <DAOAdminHeader title="Admin users" subtitle="Roles: Super Admin, Manager, Content Manager, Order Manager, Customer Support."
        actions={<Button icon={<Plus className="size-4" />} onClick={() => setDraft({ name: '', email: '', password: '', admin_role_id: String(roles.data?.[0]?.id ?? ''), is_active: true })}>Invite admin</Button>} />
      <DAODataTable columns={columns} query={users} page={page} onPage={setPage} rowKey={(u) => u.id}
        onRowClick={(u) => setDraft({ id: u.id, name: u.name, email: u.email, password: '', admin_role_id: String(u.role?.id ?? ''), is_active: u.is_active })} />
      <DAOConfirmDialog open={!!draft} title={draft?.id ? 'Edit admin' : 'New admin'} confirmLabel="Save" loading={save.isPending} onClose={() => setDraft(null)} onConfirm={() => draft && save.mutate(draft)}>
        {draft ? <>
          <Field label="Name"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
          <Field label="Email"><Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></Field>
          <Field label={draft.id ? 'New password (optional)' : 'Password'} hint="At least 12 characters with letters and numbers"><Input type="password" autoComplete="new-password" value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} /></Field>
          <Field label="Role"><Select value={draft.admin_role_id} onChange={(e) => setDraft({ ...draft, admin_role_id: e.target.value })}>{roles.data?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select></Field>
          <Toggle label="Active" checked={draft.is_active} onChange={(v) => setDraft({ ...draft, is_active: v })} />
        </> : null}
      </DAOConfirmDialog>
    </>
  )
}
