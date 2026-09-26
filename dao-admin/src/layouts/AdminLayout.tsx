import { LogOut, Menu, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { useThemeMode } from '@/hooks/useTheme'
import { DAOSidebar } from './DAOSidebar'

export function AdminLayout() {
  const { me, loading, logout } = useAuth()
  const [mode, toggle] = useThemeMode()
  const [open, setOpen] = useState(false)
  const location = useLocation()

  if (loading) return <div className="grid h-full place-items-center text-ink-muted">Loading…</div>
  if (!me) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  return (
    <div className="flex h-full">
      <aside className="hidden w-64 shrink-0 border-r border-line lg:block"><DAOSidebar /></aside>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal>
          <button aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-line"><DAOSidebar onNavigate={() => setOpen(false)} /></div>
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:px-8">
          <button className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu className="size-5" /></button>
          <span className="hidden text-sm text-ink-muted lg:block">DAO — Fashion &amp; Lifestyle</span>
          <div className="flex items-center gap-3">
            <button onClick={toggle} aria-label={mode === 'botanical' ? 'Switch to DAO Midnight' : 'Switch to DAO Botanical'} className="rounded-full p-2 hover:bg-muted">
              {mode === 'botanical' ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </button>
            <div className="text-right text-xs leading-tight">
              <p className="font-medium">{me.name}</p>
              <p className="text-ink-muted">{me.role.name}</p>
            </div>
            <button onClick={() => void logout()} aria-label="Log out" className="rounded-full p-2 hover:bg-muted"><LogOut className="size-4" /></button>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 lg:px-8"><Outlet /></main>
      </div>
    </div>
  )
}
