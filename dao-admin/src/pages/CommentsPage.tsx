import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, DAOAdminHeader, DAOConfirmDialog, DAODataTable, DAOStatusBadge, Input, Select, Textarea, useToast, type Column } from '@/components/ui'
import { api, errorMessage } from '@/lib/api'
import { dateTime } from '@/lib/format'
import type { Paged } from '@/types/api'

interface Row {
  id: number; video: { id: number; title: string | null }; user: { id: number; name: string | null; avatar_url: string | null }
  body: string | null; image_url: string | null; is_reply: boolean; like_count: number; reply_count: number
  status: 'visible' | 'banned'; banned_reason: string | null; created_at: string | null
}
type Action = { kind: 'ban' | 'delete'; row: Row }

/** Moderation queue for video comments. A banned comment stays visible to its author only, marked as banned. */
export default function CommentsPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const video = params.get('video') ?? ''
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [withImage, setWithImage] = useState(false)
  const [action, setAction] = useState<Action | null>(null)
  const [reason, setReason] = useState('')

  const query = useQuery({
    queryKey: ['comments', page, status, q, video, withImage],
    queryFn: () => api.page<Paged<Row>>('/comments', { page, status: status || undefined, q: q || undefined, video_id: video || undefined, with_image: withImage ? 1 : undefined }),
  })
  const done = (msg: string) => { toast(msg); setAction(null); setReason(''); void qc.invalidateQueries({ queryKey: ['comments'] }) }
  const ban = useMutation({ mutationFn: (r: Row) => api.post(`/comments/${r.id}/ban`, { reason: reason.trim() || undefined }), onSuccess: () => done('Comment banned'), onError: (e) => toast(errorMessage(e), 'error') })
  const unban = useMutation({ mutationFn: (r: Row) => api.post(`/comments/${r.id}/unban`), onSuccess: () => done('Comment restored'), onError: (e) => toast(errorMessage(e), 'error') })
  const remove = useMutation({ mutationFn: (r: Row) => api.del(`/comments/${r.id}`), onSuccess: () => done('Comment deleted'), onError: (e) => toast(errorMessage(e), 'error') })

  const columns: Column<Row>[] = [
    { key: 'u', header: 'User', render: (r) => <div className="flex items-center gap-2">
      {r.user.avatar_url ? <img src={r.user.avatar_url} alt="" className="size-8 rounded-full object-cover" /> : <span className="grid size-8 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{(r.user.name ?? '?').slice(0, 1).toUpperCase()}</span>}
      <span className="text-sm">{r.user.name ?? 'DAO member'}</span>
    </div> },
    { key: 'c', header: 'Comment', render: (r) => <div className="max-w-md">
      {r.body ? <p className="whitespace-pre-wrap break-words">{r.body}</p> : null}
      {r.image_url ? <a href={r.image_url} target="_blank" rel="noreferrer"><img src={r.image_url} alt="" className="mt-1 h-20 rounded-md object-cover" /></a> : null}
      {r.banned_reason ? <p className="mt-1 text-xs text-danger">Reason: {r.banned_reason}</p> : null}
      <p className="mt-1 text-xs text-ink-subtle">{r.is_reply ? 'Reply' : `${r.reply_count} replies`} · {r.like_count} likes</p>
    </div> },
    { key: 'v', header: 'Video', render: (r) => <button className="text-left text-primary hover:underline" onClick={() => { setParams({ video: String(r.video.id) }); setPage(1) }}>{r.video.title ?? `#${r.video.id}`}</button> },
    { key: 'd', header: 'Posted', render: (r) => dateTime(r.created_at) },
    { key: 's', header: 'Status', render: (r) => <DAOStatusBadge status={r.status} /> },
    { key: 'a', header: '', render: (r) => <div className="flex gap-2">
      {r.status === 'visible' ? <Button size="sm" variant="secondary" onClick={() => setAction({ kind: 'ban', row: r })}>Ban</Button> : <Button size="sm" onClick={() => unban.mutate(r)} loading={unban.isPending && unban.variables?.id === r.id}>Unban</Button>}
      <Button size="sm" variant="danger" onClick={() => setAction({ kind: 'delete', row: r })}>Delete</Button>
    </div> },
  ]
  return (
    <>
      <DAOAdminHeader title="Comments" subtitle="Ban hides a comment from everyone but its author, who sees it marked as banned. Delete removes it (and its replies) for good." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select className="max-w-40" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}><option value="">All statuses</option><option value="visible">Visible</option><option value="banned">Banned</option></Select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={withImage} onChange={(e) => { setWithImage(e.target.checked); setPage(1) }} /> With photo</label>
        {video ? <Button size="sm" variant="secondary" onClick={() => { setParams({}); setPage(1) }}>Video #{video} ✕</Button> : null}
        <Input className="ml-auto max-w-xs" placeholder="Search text or user…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
      </div>
      <DAODataTable columns={columns} query={query} page={page} onPage={setPage} rowKey={(r) => r.id} empty="No comments ✦" />
      <DAOConfirmDialog
        open={action !== null} onClose={() => { setAction(null); setReason('') }}
        title={action?.kind === 'ban' ? 'Ban this comment?' : 'Delete this comment?'}
        message={action?.kind === 'ban' ? 'Others will no longer see it. The author will see that it was banned.' : 'This also removes its replies and cannot be undone.'}
        confirmLabel={action?.kind === 'ban' ? 'Ban' : 'Delete'} destructive loading={ban.isPending || remove.isPending}
        onConfirm={() => action && (action.kind === 'ban' ? ban.mutate(action.row) : remove.mutate(action.row))}
      >
        {action?.kind === 'ban' ? <Textarea rows={2} maxLength={255} placeholder="Reason (optional, kept in the audit log)" value={reason} onChange={(e) => setReason(e.target.value)} /> : null}
      </DAOConfirmDialog>
    </>
  )
}
