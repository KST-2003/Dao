import { useEffect, useState } from 'react'

type Mode = 'botanical' | 'midnight'

/** DAO Botanical ⇄ DAO Midnight, remembered per browser. */
export function useThemeMode(): [Mode, () => void] {
  const [mode, setMode] = useState<Mode>(() => {
    try {
      return (localStorage.getItem('dao-admin-theme') as Mode) ?? 'botanical'
    } catch {
      return 'botanical'
    }
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'midnight')
    try {
      localStorage.setItem('dao-admin-theme', mode)
    } catch {
      /* ignore */
    }
  }, [mode])
  return [mode, () => setMode((m) => (m === 'botanical' ? 'midnight' : 'botanical'))]
}
