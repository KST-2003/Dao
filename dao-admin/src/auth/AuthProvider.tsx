import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, type PropsWithChildren } from 'react'
import { api, ApiError, setUnauthorizedHandler } from '@/lib/api'
import type { AdminMe, Permission } from '@/types/api'

interface AuthState {
  me: AdminMe | null
  loading: boolean
  can: (...perms: Permission[]) => boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const qc = useQueryClient()
  const me = useQuery({
    queryKey: ['admin-me'],
    queryFn: async () => {
      try {
        return await api.get<AdminMe>('/auth/me')
      } catch (e) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return null
        throw e
      }
    },
    staleTime: 5 * 60_000,
  })

  useEffect(() => setUnauthorizedHandler(() => qc.setQueryData(['admin-me'], null)), [qc])

  const value: AuthState = {
    me: me.data ?? null,
    loading: me.isPending,
    can: (...perms) => {
      const granted = me.data?.permissions ?? []
      return granted.includes('*') || perms.some((p) => granted.includes(p))
    },
    login: async (email, password) => {
      const admin = await api.post<AdminMe>('/auth/login', { email, password })
      qc.setQueryData(['admin-me'], admin)
    },
    logout: async () => {
      await api.post('/auth/logout').catch(() => undefined)
      qc.clear()
      qc.setQueryData(['admin-me'], null)
    },
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth outside AuthProvider')
  return ctx
}
