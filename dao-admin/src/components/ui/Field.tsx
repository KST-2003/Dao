import clsx from 'clsx'
import type { InputHTMLAttributes, PropsWithChildren, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const control = 'w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none'

export function Field({ label, error, hint, children, className }: PropsWithChildren<{ label?: string; error?: string; hint?: string; className?: string }>) {
  return (
    <label className={clsx('flex flex-col gap-1', className)}>
      {label ? <span className="text-xs font-medium text-ink-muted">{label}</span> : null}
      {children}
      {error ? <span className="text-xs text-danger">{error}</span> : hint ? <span className="text-xs text-ink-subtle">{hint}</span> : null}
    </label>
  )
}

export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={clsx(control, className)} />
export const Textarea = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea rows={4} {...p} className={clsx(control, className)} />
export const Select = ({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className={clsx(control, className)}>{children}</select>
)

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="inline-flex items-center gap-2 text-sm">
      <span className={clsx('relative h-5 w-9 rounded-full transition', checked ? 'bg-primary' : 'bg-line')}>
        <span className={clsx('absolute top-0.5 size-4 rounded-full bg-white shadow transition', checked ? 'left-4.5' : 'left-0.5')} />
      </span>
      {label}
    </button>
  )
}
