import clsx from 'clsx'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'

export function Button({ variant = 'primary', size = 'md', loading, icon, className, children, disabled, ...rest }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md'; loading?: boolean; icon?: ReactNode }) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium transition disabled:opacity-50 disabled:cursor-not-allowed',
        size === 'sm' ? 'h-8 px-3 text-sm' : 'h-10 px-5 text-sm',
        {
          primary: 'bg-primary text-on-primary hover:opacity-90',
          secondary: 'border border-line bg-surface text-ink hover:bg-muted',
          ghost: 'text-primary hover:bg-primary-soft',
          danger: 'border border-danger text-danger hover:bg-danger-soft',
          gold: 'bg-gold text-white hover:opacity-90',
        }[variant],
        className,
      )}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  )
}
