import clsx from 'clsx'
import { useState } from 'react'
import { LOCALES, LOCALE_LABELS, type Locale, type Translations } from '@/types/api'
import { Field, Input, Textarea } from './Field'

export interface TranslatedField {
  name: string
  label: string
  multiline?: boolean
  list?: boolean
  required?: boolean
}

/**
 * EN / TH / MY editor. English is the controlled fallback language, so its required
 * fields must be filled; missing TH/MY fall back to EN in the app (never a raw key).
 */
export function TranslationTabs<F extends string>({ fields, value, onChange, errors }: {
  fields: TranslatedField[]
  value: Translations<F>
  onChange: (next: Translations<F>) => void
  errors?: (key: string) => string | undefined
}) {
  const [locale, setLocale] = useState<Locale>('en')
  const current = (value[locale] ?? {}) as Record<string, string | string[] | null | undefined>
  const set = (name: string, v: string | string[]) => onChange({ ...value, [locale]: { ...current, [name]: v } } as Translations<F>)
  const filled = (l: Locale) => fields.some((f) => {
    const v = (value[l] as Record<string, unknown> | undefined)?.[f.name]
    return Array.isArray(v) ? v.length > 0 : !!v
  })

  return (
    <div className="rounded-xl border border-line">
      <div role="tablist" className="flex border-b border-line">
        {LOCALES.map((l) => (
          <button key={l} type="button" role="tab" aria-selected={l === locale} onClick={() => setLocale(l)}
            className={clsx('flex items-center gap-2 px-4 py-2 text-sm', l === locale ? 'border-b-2 border-primary font-medium text-primary' : 'text-ink-muted')}>
            {LOCALE_LABELS[l]}
            <span className={clsx('size-1.5 rounded-full', filled(l) ? 'bg-primary' : 'bg-line')} />
          </button>
        ))}
      </div>
      <div className="grid gap-4 p-4">
        {fields.map((f) => {
          const v = current[f.name]
          const label = `${f.label}${f.required && locale === 'en' ? ' *' : ''}`
          const err = errors?.(`translations.${locale}.${f.name}`)
          if (f.list) {
            const text = Array.isArray(v) ? v.join('\n') : ''
            return <Field key={f.name} label={label} hint="One per line" error={err}><Textarea value={text} onChange={(e) => set(f.name, e.target.value.split('\n').filter((x) => x.trim() !== ''))} /></Field>
          }
          return (
            <Field key={f.name} label={label} error={err}>
              {f.multiline ? <Textarea value={(v as string) ?? ''} onChange={(e) => set(f.name, e.target.value)} lang={locale} /> : <Input value={(v as string) ?? ''} onChange={(e) => set(f.name, e.target.value)} lang={locale} />}
            </Field>
          )
        })}
      </div>
    </div>
  )
}
