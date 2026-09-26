import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, DAOAdminCard, DAOAdminHeader, DAODataTable, Field, Input, Select, Textarea, useToast, type Column } from '@/components/ui'
import { api, errorMessage } from '@/lib/api'
import { dateTime } from '@/lib/format'
import { LOCALES, LOCALE_LABELS, type Locale, type Paged } from '@/types/api'

const TYPES = ['new_drop', 'promotion', 'vip_event', 'new_vlog', 'new_recipe', 'member_reward']
interface Row { id: number; admin: string | null; payload: { type?: string; content?: Record<string, { title?: string }> } | null; created_at: string | null }

/** Push + in-app broadcast. Each member receives the text in their own language (falls back to English). */
export default function NotificationsPage() {
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [type, setType] = useState('new_drop')
  const [route, setRoute] = useState('')
  const [content, setContent] = useState<Record<Locale, { title: string; body: string }>>({ en: { title: '', body: '' }, th: { title: '', body: '' }, my: { title: '', body: '' } })
  const history = useQuery({ queryKey: ['broadcasts', page], queryFn: () => api.page<Paged<Row>>('/notifications', { page }) })
  const send = useMutation({
    mutationFn: () => api.post('/notifications/broadcast', { type, content, route: route || null }),
    onSuccess: () => { toast('Broadcast queued'); void history.refetch() },
    onError: (e) => toast(errorMessage(e), 'error'),
  })
  const columns: Column<Row>[] = [
    { key: 'd', header: 'Sent', render: (r) => dateTime(r.created_at) },
    { key: 't', header: 'Type', render: (r) => r.payload?.type ?? '—' },
    { key: 'x', header: 'Title (EN)', render: (r) => r.payload?.content?.en?.title ?? '—' },
    { key: 'a', header: 'By', render: (r) => r.admin ?? '—' },
  ]
  return (
    <>
      <DAOAdminHeader title="Notifications" subtitle="Order, points and tier notifications are automatic. Use this for drops, campaigns and VIP events." />
      <DAOAdminCard title="New broadcast" className="mb-6">
        <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); send.mutate() }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type"><Select value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}</Select></Field>
            <Field label="Open in app (route)" hint="e.g. /collection/new-season or /video/12"><Input value={route} onChange={(e) => setRoute(e.target.value)} /></Field>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {LOCALES.map((l) => (
              <div key={l} className="space-y-2 rounded-xl border border-line p-3">
                <p className="text-sm font-medium">{LOCALE_LABELS[l]}{l === 'en' ? ' *' : ''}</p>
                <Input placeholder="Title" required={l === 'en'} maxLength={120} value={content[l].title} onChange={(e) => setContent({ ...content, [l]: { ...content[l], title: e.target.value } })} lang={l} />
                <Textarea placeholder="Message" required={l === 'en'} maxLength={500} rows={3} value={content[l].body} onChange={(e) => setContent({ ...content, [l]: { ...content[l], body: e.target.value } })} lang={l} />
              </div>
            ))}
          </div>
          <div className="flex justify-end"><Button type="submit" variant="gold" loading={send.isPending}>Send to all members</Button></div>
        </form>
      </DAOAdminCard>
      <DAODataTable columns={columns} query={history} page={page} onPage={setPage} rowKey={(r) => r.id} empty="No broadcasts yet." />
    </>
  )
}
