import clsx from 'clsx'
import type { PropsWithChildren, ReactNode } from 'react'

export function DAOAdminCard({ title, actions, className, children }: PropsWithChildren<{ title?: string; actions?: ReactNode; className?: string }>) {
  return (
    <section className={clsx('rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-soft)]', className)}>
      {title || actions ? (
        <header className="mb-4 flex items-center justify-between gap-3">
          {title ? <h2 className="font-display text-xl font-semibold">{title}</h2> : <span />}
          <div className="flex items-center gap-2">{actions}</div>
        </header>
      ) : null}
      {children}
    </section>
  )
}
