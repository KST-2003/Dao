import type { ReactNode } from 'react'
import { AlertTriangle, Flower2 } from 'lucide-react'
import { errorMessage } from '@/lib/api'
import { Button } from './Button'

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line bg-surface p-12 text-center">
      <Flower2 className="size-8 text-sage" />
      <p className="text-ink-muted">{message}</p>
      {action}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-12 text-center">
      <AlertTriangle className="size-8 text-danger" />
      <p className="text-ink-muted">{errorMessage(error)}</p>
      {onRetry ? <Button variant="secondary" onClick={onRetry}>Try again</Button> : null}
    </div>
  )
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 rounded-[var(--radius-card)] border border-line bg-surface p-4" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />)}
    </div>
  )
}
