import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, Field, Input, useToast } from '@/components/ui'
import { api, errorMessage } from '@/lib/api'

/** Manual adjustment: the reason, admin and time are recorded in the ledger and the audit log. */
export function PointsAdjustForm({ userId, onDone }: { userId?: number; onDone?: () => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [uid, setUid] = useState(userId ? String(userId) : '')
  const [points, setPoints] = useState('')
  const [reason, setReason] = useState('')
  const m = useMutation({
    mutationFn: () => api.post('/points/adjust', { user_id: Number(uid), points: Number(points), reason }),
    onSuccess: () => { toast('Points adjusted'); setPoints(''); setReason(''); void qc.invalidateQueries({ queryKey: ['ledger'] }); onDone?.() },
    onError: (e) => toast(errorMessage(e), 'error'),
  })
  return (
    <form className="grid gap-3 sm:grid-cols-4" onSubmit={(e) => { e.preventDefault(); m.mutate() }}>
      {!userId ? <Field label="Customer ID"><Input type="number" required value={uid} onChange={(e) => setUid(e.target.value)} /></Field> : null}
      <Field label="Points (+/−)"><Input type="number" required value={points} onChange={(e) => setPoints(e.target.value)} placeholder="+100 or -50" /></Field>
      <Field label="Reason (required)" className={userId ? 'sm:col-span-2' : ''}><Input required minLength={5} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Goodwill for delayed delivery" /></Field>
      <div className="flex items-end"><Button type="submit" loading={m.isPending} disabled={!points || reason.length < 5}>Apply</Button></div>
    </form>
  )
}
