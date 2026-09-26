/** Money is stored in minor units (satang). The admin edits baht and converts. */
export const toMajor = (minor: number | null | undefined) => (minor == null ? '' : String(minor / 100))
export const toMinor = (major: string | number | null | undefined): number | null => {
  if (major === '' || major == null) return null
  const n = Number(major)
  return Number.isFinite(n) ? Math.round(n * 100) : null
}
export const money = (minor: number | null | undefined, currency = 'THB') =>
  `${currency === 'THB' ? '฿' : `${currency} `}${((minor ?? 0) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
export const num = (n: number | null | undefined) => (n ?? 0).toLocaleString('en-US')
export const dateTime = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—')
export const date = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString('en-GB', { dateStyle: 'medium' }) : '—')
/** <input type="datetime-local"> value ⇄ ISO */
export const toLocalInput = (iso: string | null | undefined) => (iso ? new Date(iso).toISOString().slice(0, 16) : '')
export const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null)
