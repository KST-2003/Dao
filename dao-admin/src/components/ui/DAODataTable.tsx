import clsx from 'clsx'
import type { ReactNode } from 'react'
import type { Paged } from '@/types/api'
import { Button } from './Button'
import { EmptyState, ErrorState, TableSkeleton } from './States'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
}

interface Props<T> {
  columns: Column<T>[]
  query: { data?: Paged<T>; isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown }
  onRowClick?: (row: T) => void
  page: number
  onPage: (p: number) => void
  empty?: string
  rowKey: (row: T) => string | number
}

/** Server-paginated table with loading / error / empty states. */
export function DAODataTable<T>({ columns, query, onRowClick, page, onPage, empty = 'Nothing here yet.', rowKey }: Props<T>) {
  if (query.isPending) return <TableSkeleton />
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />
  const rows = query.data?.data ?? []
  if (rows.length === 0) return <EmptyState message={empty} />
  const meta = query.data!.meta
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase tracking-wider text-ink-muted">
            <tr>{columns.map((c) => <th key={c.key} scope="col" className={clsx('px-4 py-3 font-medium', c.className)}>{c.header}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                className={clsx('border-t border-line', onRowClick && 'cursor-pointer hover:bg-muted/60 focus:bg-muted/60')}>
                {columns.map((c) => <td key={c.key} className={clsx('px-4 py-3 align-middle', c.className)}>{c.render(row)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-ink-muted">
        <span>{meta.total.toLocaleString()} total · page {meta.current_page} of {meta.last_page}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
          <Button size="sm" variant="secondary" disabled={page >= meta.last_page} onClick={() => onPage(page + 1)}>Next</Button>
        </div>
      </div>
    </div>
  )
}
