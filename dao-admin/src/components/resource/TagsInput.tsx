import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useState } from 'react'
import { Field, Input } from '@/components/ui'
import { api } from '@/lib/api'

/** Chip tag input with autocomplete over tags already used on other videos, so admins converge on one spelling. */
export function TagsInput({ value, onChange, label = 'Tags' }: { value: string[]; onChange: (tags: string[]) => void; label?: string }) {
  const [q, setQ] = useState('')
  const suggest = useQuery({ queryKey: ['video-tags', q], queryFn: () => api.get<string[]>('/videos/tags', { q }), enabled: q.trim().length > 0 })

  const add = (raw: string) => {
    const tag = raw.trim().toLowerCase()
    if (tag && !value.includes(tag)) onChange([...value, tag])
    setQ('')
  }

  return (
    <Field label={label} hint="Enter or comma to add">
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-xs text-primary">
            {tag}
            <button type="button" aria-label={`Remove ${tag}`} onClick={() => onChange(value.filter((t) => t !== tag))}><X className="size-3" /></button>
          </span>
        ))}
      </div>
      <Input
        value={q}
        onChange={(e) => {
          const v = e.target.value
          if (v.endsWith(',')) add(v.slice(0, -1))
          else setQ(v)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); add(q) }
          if (e.key === 'Backspace' && q === '' && value.length > 0) onChange(value.slice(0, -1))
        }}
      />
      {q.trim() && suggest.data ? (
        <ul className="max-h-40 overflow-y-auto rounded-xl border border-line bg-surface text-sm">
          {suggest.data.filter((tag) => !value.includes(tag)).map((tag) => (
            <li key={tag}><button type="button" className="w-full px-3 py-2 text-left hover:bg-muted" onClick={() => add(tag)}>{tag}</button></li>
          ))}
          {!suggest.data.includes(q.trim().toLowerCase()) ? (
            <li><button type="button" className="w-full px-3 py-2 text-left text-ink-subtle hover:bg-muted" onClick={() => add(q)}>Add "{q.trim()}"</button></li>
          ) : null}
        </ul>
      ) : null}
    </Field>
  )
}
