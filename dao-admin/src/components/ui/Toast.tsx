import { createContext, useCallback, useContext, useState, type PropsWithChildren } from 'react'

type Tone = 'success' | 'error'
const ToastCtx = createContext<(message: string, tone?: Tone) => void>(() => undefined)

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<{ message: string; tone: Tone; id: number } | null>(null)
  const show = useCallback((message: string, tone: Tone = 'success') => {
    const id = Date.now()
    setToast({ message, tone, id })
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 3500)
  }, [])
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
        {toast ? <div className={`rounded-full px-5 py-2.5 text-sm shadow-[var(--shadow-card)] ${toast.tone === 'error' ? 'bg-danger text-white' : 'bg-ink text-bg'}`}>✦ {toast.message}</div> : null}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
