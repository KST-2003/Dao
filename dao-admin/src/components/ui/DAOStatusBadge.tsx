import clsx from 'clsx'

const TONES: Record<string, string> = {
  published: 'bg-primary-soft text-primary', active: 'bg-primary-soft text-primary', approved: 'bg-primary-soft text-primary',
  paid: 'bg-primary-soft text-primary', succeeded: 'bg-primary-soft text-primary', delivered: 'bg-primary-soft text-primary', rewarded: 'bg-primary-soft text-primary',
  processing: 'bg-gold-soft text-gold', packing: 'bg-gold-soft text-gold', packaging: 'bg-gold-soft text-gold', shipped: 'bg-gold-soft text-gold', pending: 'bg-gold-soft text-gold',
  pending_payment: 'bg-gold-soft text-gold', requires_action: 'bg-gold-soft text-gold', scheduled: 'bg-gold-soft text-gold', draft: 'bg-muted text-ink-muted',
  cancelled: 'bg-danger-soft text-danger', refunded: 'bg-danger-soft text-danger', rejected: 'bg-danger-soft text-danger', banned: 'bg-danger-soft text-danger', visible: 'bg-primary-soft text-primary', failed: 'bg-danger-soft text-danger',
  submitted: 'bg-muted text-ink-muted', in_review: 'bg-gold-soft text-gold', waiting_payment: 'bg-gold-soft text-gold',
  in_process: 'bg-gold-soft text-gold', waiting_courier: 'bg-gold-soft text-gold', in_transit: 'bg-gold-soft text-gold',
  landed_myanmar: 'bg-gold-soft text-gold', on_delivery: 'bg-gold-soft text-gold', completed: 'bg-primary-soft text-primary',
  archived: 'bg-muted text-ink-subtle', inactive: 'bg-muted text-ink-subtle',
}

export function DAOStatusBadge({ status }: { status: string }) {
  return <span className={clsx('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', TONES[status] ?? 'bg-muted text-ink-muted')}>{status.replace(/_/g, ' ')}</span>
}
