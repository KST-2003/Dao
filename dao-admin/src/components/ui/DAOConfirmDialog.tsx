import { useEffect, useRef, type ReactNode } from 'react'
import { Button } from './Button'

interface Props {
  open: boolean
  title: string
  message?: ReactNode
  confirmLabel?: string
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
  children?: ReactNode
}

/** Native <dialog> — focus-trapped and Esc-to-close for keyboard users. */
export function DAOConfirmDialog({ open, title, message, confirmLabel = 'Confirm', destructive, loading, onConfirm, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} onClose={onClose} className="m-auto w-[min(92vw,460px)] rounded-[var(--radius-card)] border border-line bg-surface p-6 text-ink shadow-[var(--shadow-card)] backdrop:bg-black/40">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      {message ? <div className="mt-2 text-sm text-ink-muted">{message}</div> : null}
      {children ? <div className="mt-4 space-y-3">{children}</div> : null}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
        <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} loading={loading} type="button">{confirmLabel}</Button>
      </div>
    </dialog>
  )
}
