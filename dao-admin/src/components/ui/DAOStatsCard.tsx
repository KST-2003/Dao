import type { ReactNode } from 'react'

export function DAOStatsCard({ label, value, icon, accent }: { label: string; value: string; icon?: ReactNode; accent?: 'gold' | 'sage' | 'rose' }) {
  const tone = { gold: 'bg-gold-soft text-gold', sage: 'bg-primary-soft text-primary', rose: 'bg-danger-soft text-danger' }[accent ?? 'sage']
  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-soft)]">
      {icon ? <div className={`grid size-11 place-items-center rounded-full ${tone}`}>{icon}</div> : null}
      <div>
        <p className="text-xs uppercase tracking-wider text-ink-muted">{label}</p>
        <p className="font-display text-3xl font-semibold">{value}</p>
      </div>
    </div>
  )
}
