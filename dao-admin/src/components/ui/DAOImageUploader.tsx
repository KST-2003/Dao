import { ImagePlus, Loader2, Video } from 'lucide-react'
import { useState } from 'react'
import { api, errorMessage } from '@/lib/api'

type Folder = 'products' | 'collections' | 'categories' | 'banners' | 'videos' | 'thumbnails' | 'recipes' | 'rewards' | 'tiers'

interface Stored { url: string; thumbnail_url: string | null }

/** Uploads through /uploads (server validates type, size, dimensions) and returns the public URL. */
function Uploader({ kind, folder, value, onChange, label }: { kind: 'image' | 'video'; folder: Folder; value: string | null; onChange: (url: string | null) => void; label: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const accept = kind === 'image' ? 'image/jpeg,image/png,image/webp,image/heic' : 'video/mp4,video/quicktime,video/webm'

  const upload = async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('kind', kind)
      form.append('folder', folder)
      form.append('file', file)
      const stored = await api.upload<Stored>('/uploads', form)
      onChange(stored.url)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      <div className="flex items-center gap-3">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-muted">
          {value ? (kind === 'image' ? <img src={value} alt="" className="size-full object-cover" /> : <Video className="size-6 text-primary" />) : kind === 'image' ? <ImagePlus className="size-6 text-ink-subtle" /> : <Video className="size-6 text-ink-subtle" />}
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <label className="cursor-pointer text-primary hover:underline">
            {busy ? <Loader2 className="inline size-4 animate-spin" /> : 'Upload'}
            <input type="file" accept={accept} className="sr-only" disabled={busy} onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])} />
          </label>
          {value ? <button type="button" className="text-left text-ink-muted hover:underline" onClick={() => onChange(null)}>Remove</button> : null}
          {value ? <a href={value} target="_blank" rel="noreferrer" className="max-w-64 truncate text-xs text-ink-subtle">{value}</a> : null}
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
