import clsx from 'clsx'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { NAV } from './nav'

export function DAOSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { can } = useAuth()
  return (
    <nav aria-label="Main" className="flex h-full flex-col gap-6 overflow-y-auto bg-sidebar px-4 py-6">
      <div className="flex items-center px-2">
        <img src="/dao-mark.png" alt="DAO Admin" className="h-16 w-full object-contain object-left" />
      </div>
      {NAV.map((group) => {
        const items = group.items.filter((i) => can(...i.perms))
        if (items.length === 0) return null
        return (
          <div key={group.label}>
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">{group.label}</p>
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.to === '/'} onClick={onNavigate}
                    className={({ isActive }) => clsx('flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition', isActive ? 'bg-primary-soft font-medium text-primary' : 'text-ink hover:bg-muted')}>
                    <item.icon className="size-4" aria-hidden />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}
