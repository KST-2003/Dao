import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { Button, DAOAdminCard, DAOAdminHeader, Field, Input, useToast } from '@/components/ui'
import { api, errorMessage } from '@/lib/api'
import { uploadViaPresign } from '@/lib/upload'

/** Your own name and picture — shown as the creator on every reel you publish. */
export default function ProfilePage() {
  const { me } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const [name, setName] = useState(me?.name ?? '')
  const [preview, setPreview] = useState<string | null | undefined>(undefined) // undefined = unchanged
  const [key, setKey] = useState<string | null | undefined>(undefined)
  const [busy, setBusy] = useState(false)

  const save = useMutation({
    mutationFn: () => api.put('/auth/profile', { name, ...(key !== undefined ? { avatar_url: key } : {}) }),
    onSuccess: () => { toast('Profile saved'); setKey(undefined); void qc.invalidateQueries({ queryKey: ['admin-me'] }) },
    onError: (e) => toast(errorMessage(e), 'error'),
  })
  const upload = async (file: File) => {
    setBusy(true)
    try {
      const r = await uploadViaPresign('/auth/profile/avatar/presign', file, { size: file.size })
      setKey(r.key)
      setPreview(r.url ?? null)
    } catch (e) {
      toast(errorMessage(e), 'error')
    } finally {
      setBusy(false)
    }
  }

  if (!me) return null
  const shown = preview === undefined ? me.avatar_url : preview

  return (
    <>
      <DAOAdminHeader title="My profile" subtitle="Your name and picture appear as the creator on reels you publish." />
      <form className="max-w-xl" onSubmit={(e) => { e.preventDefault(); save.mutate() }}>
        <DAOAdminCard title="Profile">
          <div className="grid gap-5">
            <div className="flex items-center gap-4">
              {shown ? <img src={shown} alt="" className="size-20 rounded-full object-cover" /> : <span className="grid size-20 place-items-center rounded-full bg-primary-soft text-2xl font-semibold text-primary">{name.slice(0, 1).toUpperCase() || '?'}</span>}
              <div className="flex flex-col gap-1 text-sm">
                <label className="cursor-pointer text-primary hover:underline">
                  {busy ? <Loader2 className="inline size-4 animate-spin" /> : 'Upload picture'}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="sr-only" disabled={busy} onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])} />
                </label>
                {shown ? <button type="button" className="text-left text-ink-muted hover:underline" onClick={() => { setPreview(null); setKey(null) }}>Remove</button> : null}
                <span className="text-xs text-ink-subtle">Square photos look best (shown as a circle).</span>
              </div>
            </div>
            <Field label="Display name" hint="Shown on reels, e.g. “Dao”"><Input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Email"><Input value={me.email} disabled /></Field>
            <div><Button type="submit" loading={save.isPending}>Save</Button></div>
          </div>
        </DAOAdminCard>
      </form>
    </>
  )
}
