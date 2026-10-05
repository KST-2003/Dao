import { ImagePlus, Loader2, Video } from 'lucide-react'
import { useState } from 'react'
import { errorMessage } from '@/lib/api'
import { uploadViaPresign } from '@/lib/upload'

type Folder = 'collections' | 'categories' | 'banners' | 'videos' | 'thumbnails' | 'recipes' | 'rewards' | 'tiers'

/**
 * Presigns via /uploads, then PUTs straight to R2 — the file never passes through our
 * server. `value`/`onChange` carry the R2 key (what's actually saved), while the preview
 * shown here uses the presign response's own resolved URL.
 */
function Uploader({ kind, folder, value, onChange, label }: { kind: 'image' | 'video'; folder: Folder; value: string | null; onChange: (key: string | null) => void; label: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const accept = kind === 'image' ? 'image/jpeg,image/png,image/webp,image/heic' : 'video/mp4,video/quicktime,video/webm'

  const upload = async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      const { key, url } = await uploadViaPresign('/uploads', file, { kind, folder, size: file.size })
      setPreview(url ?? null)
      onChange(key)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  // `value` is already a resolved, displayable URL right after a GET (the backend cast
  // resolves it); after a *new* upload it becomes the bare key instead, so `preview` (the
  // presign response's own resolved URL) takes over until the parent refetches.
  const display = preview ?? value

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      <div className="flex items-center gap-3">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-muted">
          {display ? (kind === 'image' ? <img src={display} alt="" className="size-full object-cover" /> : <Video className="size-6 text-primary" />) : kind === 'image' ? <ImagePlus className="size-6 text-ink-subtle" /> : <Video className="size-6 text-ink-subtle" />}
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <label className="cursor-pointer text-primary hover:underline">
            {busy ? <Loader2 className="inline size-4 animate-spin" /> : 'Upload'}
            <input type="file" accept={accept} className="sr-only" disabled={busy} onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])} />
          </label>
          {value ? <button type="button" className="text-left text-ink-muted hover:underline" onClick={() => { setPreview(null); onChange(null) }}>Remove</button> : null}
          {display ? <a href={display} target="_blank" rel="noreferrer" className="max-w-64 truncate text-xs text-ink-subtle">View file</a> : null}
        </div>
      </div>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </div>
  )
}

export const DAOImageUploader = (p: { folder: Folder; value: string | null; onChange: (url: string | null) => void; label?: string }) =>
  <Uploader kind="image" label={p.label ?? 'Image'} {...p} />
export const DAOVideoUploader = (p: { folder: Folder; value: string | null; onChange: (url: string | null) => void; label?: string }) =>
  <Uploader kind="video" label={p.label ?? 'Video'} {...p} />
