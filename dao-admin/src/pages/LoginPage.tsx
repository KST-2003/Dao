import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { Button, Field, Input } from '@/components/ui'
import { errorMessage } from '@/lib/api'

export default function LoginPage() {
  const { me, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (me) return <Navigate to="/" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email, password)
      navigate(location.state?.from ?? '/', { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-full place-items-center bg-bg px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-[var(--radius-card)] border border-line bg-surface p-8 shadow-[var(--shadow-card)]">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src="/dao-mark.png" alt="DAO" className="h-24 object-contain" />
          <h1 className="font-display text-3xl font-semibold">DAO Admin</h1>
          <p className="text-sm text-ink-muted">Fashion · Life · Style</p>
        </div>
        <Field label="Email"><Input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" loading={busy} className="w-full">Sign in</Button>
      </form>
    </div>
  )
}
