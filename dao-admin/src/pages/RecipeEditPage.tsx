import { useMutation, useQuery } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Button, DAOAdminCard, DAOAdminHeader, DAOConfirmDialog, DAOImageUploader, ErrorState, Field, Input, Select, TableSkeleton, Toggle, TranslationTabs, useToast,
} from '@/components/ui'
import { api, ApiError, errorMessage } from '@/lib/api'
import { fromLocalInput, toLocalInput } from '@/lib/format'
import { LOCALES, type Locale, type Translations } from '@/types/api'

type L = Partial<Record<Locale, string>>
interface Ingredient { name: L; quantity: string | null; unit: string | null; product_id: number | null }
interface Step { instruction: L; image_url: string | null; timer_seconds: number | null }
interface RecipeForm {
  video_id: number | null; slug: string; category: string | null; cover_image_url: string | null; prep_minutes: number; cook_minutes: number; servings: number
  difficulty: string; spice_level: number; is_featured: boolean; status: string; published_at: string | null
  translations: Translations<'title' | 'description' | 'tips'>; ingredients: Ingredient[]; steps: Step[]
}
const blank: RecipeForm = { video_id: null, slug: '', category: 'curry', cover_image_url: null, prep_minutes: 15, cook_minutes: 20, servings: 2, difficulty: 'easy', spice_level: 1, is_featured: false, status: 'draft', published_at: null, translations: {}, ingredients: [], steps: [] }

function LocalizedInputs({ value, onChange, placeholder }: { value: L; onChange: (v: L) => void; placeholder: string }) {
  return <div className="grid flex-1 gap-2 sm:grid-cols-3">{LOCALES.map((l) => <Input key={l} lang={l} placeholder={`${placeholder} (${l.toUpperCase()})${l === 'en' ? ' *' : ''}`} value={value[l] ?? ''} onChange={(e) => onChange({ ...value, [l]: e.target.value })} />)}</div>
}

export default function RecipeEditPage() {
  const { id } = useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState<RecipeForm>(blank)
  const [confirm, setConfirm] = useState(false)
  const q = useQuery({ queryKey: ['recipe', id], queryFn: () => api.get<RecipeForm>(`/recipes/${id}`), enabled: !isNew })
  useEffect(() => { if (q.data) setForm({ ...blank, ...q.data }) }, [q.data])
  const set = <K extends keyof RecipeForm>(k: K, v: RecipeForm[K]) => setForm((f) => ({ ...f, [k]: v }))

  const save = useMutation({
    mutationFn: () => {
      const body = {
        ...form,
        ingredients: form.ingredients.map(({ name, quantity, unit, product_id }) => ({ name, quantity, unit, product_id })),
        steps: form.steps.map(({ instruction, image_url, timer_seconds }) => ({ instruction, image_url, timer_seconds })),
      }
      return isNew ? api.post<{ id: number }>('/recipes', body) : api.put<{ id: number }>(`/recipes/${id}`, body)
    },
    onSuccess: (r) => { toast('Recipe saved'); if (isNew) navigate(`/recipes/${r.id}`, { replace: true }) },
    onError: (e) => toast(errorMessage(e), 'error'),
  })
  const remove = useMutation({ mutationFn: () => api.del(`/recipes/${id}`), onSuccess: () => navigate('/recipes') })

  if (!isNew && q.isPending) return <TableSkeleton />
  if (!isNew && q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />
  const err = (k: string) => (save.error instanceof ApiError ? save.error.field(k) : undefined)

  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-6">
      <DAOAdminHeader title={isNew ? 'New recipe' : (form.translations.en?.title as string) || 'Recipe'} actions={<Button type="submit" loading={save.isPending}>Save</Button>} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <DAOAdminCard title="Title, story & tips (EN · TH · MY)">
            <TranslationTabs<'title' | 'description' | 'tips'> fields={[{ name: 'title', label: 'Title', required: true }, { name: 'description', label: 'Description', multiline: true }, { name: 'tips', label: "Dao's tips", multiline: true }]} value={form.translations} onChange={(t) => set('translations', t)} errors={err} />
          </DAOAdminCard>
          <DAOAdminCard title="Ingredients" actions={<Button type="button" size="sm" variant="secondary" icon={<Plus className="size-4" />} onClick={() => set('ingredients', [...form.ingredients, { name: {}, quantity: '', unit: '', product_id: null }])}>Add</Button>}>
            <div className="space-y-3">
              {form.ingredients.map((ing, i) => (
                <div key={i} className="flex flex-wrap items-start gap-2 rounded-xl bg-muted p-3">
                  <LocalizedInputs placeholder="Ingredient" value={ing.name} onChange={(name) => set('ingredients', form.ingredients.map((x, j) => (j === i ? { ...x, name } : x)))} />
                  <Input className="w-20" placeholder="Qty" value={ing.quantity ?? ''} onChange={(e) => set('ingredients', form.ingredients.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)))} />
                  <Input className="w-20" placeholder="Unit" value={ing.unit ?? ''} onChange={(e) => set('ingredients', form.ingredients.map((x, j) => (j === i ? { ...x, unit: e.target.value } : x)))} />
                  <Input className="w-28" type="number" placeholder="Product ID" title="Link a product to show a Shop button" value={ing.product_id ?? ''} onChange={(e) => set('ingredients', form.ingredients.map((x, j) => (j === i ? { ...x, product_id: e.target.value ? Number(e.target.value) : null } : x)))} />
                  <button type="button" aria-label="Remove ingredient" onClick={() => set('ingredients', form.ingredients.filter((_, j) => j !== i))}><Trash2 className="size-4 text-danger" /></button>
                </div>
              ))}
            </div>
          </DAOAdminCard>
          <DAOAdminCard title="Steps" actions={<Button type="button" size="sm" variant="secondary" icon={<Plus className="size-4" />} onClick={() => set('steps', [...form.steps, { instruction: {}, image_url: null, timer_seconds: null }])}>Add step</Button>}>
            <ol className="space-y-3">
              {form.steps.map((st, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl bg-muted p-3">
                  <span className="mt-2 grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft text-sm text-primary">{i + 1}</span>
                  <LocalizedInputs placeholder="Instruction" value={st.instruction} onChange={(instruction) => set('steps', form.steps.map((x, j) => (j === i ? { ...x, instruction } : x)))} />
                  <button type="button" aria-label="Remove step" onClick={() => set('steps', form.steps.filter((_, j) => j !== i))}><Trash2 className="mt-2 size-4 text-danger" /></button>
                </li>
              ))}
            </ol>
          </DAOAdminCard>
        </div>
        <div className="space-y-6">
          <DAOAdminCard title="Details">
            <div className="grid gap-4">
              <DAOImageUploader label="Cover photo (4:3)" folder="recipes" value={form.cover_image_url} onChange={(v) => set('cover_image_url', v)} />
              <Field label="Slug *" error={err('slug')}><Input required value={form.slug} onChange={(e) => set('slug', e.target.value)} /></Field>
              <Field label="Category"><Select value={form.category ?? ''} onChange={(e) => set('category', e.target.value || null)}>{['curry', 'homemade', 'soup', 'snacks', 'drinks'].map((c) => <option key={c}>{c}</option>)}</Select></Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Prep (min)"><Input type="number" min={0} value={form.prep_minutes} onChange={(e) => set('prep_minutes', Number(e.target.value))} /></Field>
                <Field label="Cook (min)"><Input type="number" min={0} value={form.cook_minutes} onChange={(e) => set('cook_minutes', Number(e.target.value))} /></Field>
                <Field label="Serves"><Input type="number" min={1} value={form.servings} onChange={(e) => set('servings', Number(e.target.value))} /></Field>
              </div>
              <Field label="Difficulty"><Select value={form.difficulty} onChange={(e) => set('difficulty', e.target.value)}>{['easy', 'medium', 'hard'].map((d) => <option key={d}>{d}</option>)}</Select></Field>
              <Field label="Spice level (0–3)"><Input type="number" min={0} max={3} value={form.spice_level} onChange={(e) => set('spice_level', Number(e.target.value))} /></Field>
              <Field label="Linked video ID" hint="Shows “Watch Dao cook”"><Input type="number" value={form.video_id ?? ''} onChange={(e) => set('video_id', e.target.value ? Number(e.target.value) : null)} /></Field>
              <Field label="Status"><Select value={form.status} onChange={(e) => set('status', e.target.value)}>{['draft', 'scheduled', 'published', 'archived'].map((s) => <option key={s}>{s}</option>)}</Select></Field>
              <Field label="Publish at"><Input type="datetime-local" value={toLocalInput(form.published_at)} onChange={(e) => set('published_at', fromLocalInput(e.target.value))} /></Field>
              <Toggle label="Feature in Today's Kitchen" checked={form.is_featured} onChange={(v) => set('is_featured', v)} />
            </div>
          </DAOAdminCard>
          {!isNew ? <Button type="button" variant="danger" className="w-full" onClick={() => setConfirm(true)}>Delete recipe</Button> : null}
        </div>
      </div>
      <DAOConfirmDialog open={confirm} title="Delete this recipe?" destructive loading={remove.isPending} onClose={() => setConfirm(false)} onConfirm={() => remove.mutate()} />
    </form>
  )
}
