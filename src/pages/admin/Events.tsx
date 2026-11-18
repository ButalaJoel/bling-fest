import { useEffect, useState, type FormEvent } from 'react'
import { listEvents, saveEvent, type AdminEvent } from '../../lib/admin'
import { formatRange } from '../../lib/public'
import PageTitle from '../../components/admin/PageTitle'
import Button from '../../components/ui/Button'
import Notice from '../../components/ui/Notice'
import { TextArea, TextInput } from '../../components/forms/Field'

const blank: Omit<AdminEvent, 'id'> & { id?: string } = { slug: '', title: 'BLING FEST', theme: '', starts_on: '', ends_on: '', city: 'Kampala, Uganda', venue: '', summary: '', is_published: false }
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export default function AdminEvents() {
  const [rows, setRows] = useState<AdminEvent[] | null>(null)
  const [edit, setEdit] = useState<typeof blank | null>(null)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null)
  const load = () => listEvents().then(setRows).catch(() => setMsg({ tone: 'bad', text: 'Could not load events.' }))
  useEffect(() => { load() }, [])

  async function onSave(e: FormEvent) {
    e.preventDefault()
    if (!edit) return
    if (!edit.starts_on || !edit.ends_on || edit.ends_on < edit.starts_on) return setMsg({ tone: 'bad', text: 'Check the dates: the end date cannot be before the start.' })
    const slug = edit.slug || slugify(`${edit.title}-${edit.starts_on}`)
    try { await saveEvent({ ...edit, slug }); setEdit(null); setMsg({ tone: 'ok', text: 'Event saved.' }); load() }
    catch { setMsg({ tone: 'bad', text: 'Not saved. Check the fields (and that you are an admin, not a reviewer).' }) }
  }

  const f = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) => setEdit((s) => (s ? { ...s, [k]: v } : s))

  return (
    <>
      <PageTitle title="Events"><Button size="sm" onClick={() => { setEdit({ ...blank }); setMsg(null) }}>New event</Button></PageTitle>
      {msg && <div className="mb-4"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
      {edit && (
        <form onSubmit={onSave} className="hard-sm mb-8 grid gap-4 border-2 border-ink bg-white p-5 sm:grid-cols-2">
          <TextInput label="Title" name="title" required maxLength={120} value={edit.title} onChange={(e) => f('title', e.target.value)} />
          <TextInput label="Theme" name="theme" maxLength={160} value={edit.theme ?? ''} onChange={(e) => f('theme', e.target.value)} />
          <TextInput label="Starts" name="starts_on" type="date" required value={edit.starts_on} onChange={(e) => f('starts_on', e.target.value)} />
          <TextInput label="Ends" name="ends_on" type="date" required value={edit.ends_on} onChange={(e) => f('ends_on', e.target.value)} />
          <TextInput label="City" name="city" required maxLength={120} value={edit.city} onChange={(e) => f('city', e.target.value)} />
          <TextInput label="Venue" name="venue" maxLength={160} value={edit.venue ?? ''} onChange={(e) => f('venue', e.target.value)} hint="Leave empty until confirmed." />
          <div className="sm:col-span-2"><TextArea label="Summary" name="summary" maxLength={2000} value={edit.summary ?? ''} onChange={(e) => f('summary', e.target.value)} /></div>
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={edit.is_published} onChange={(e) => f('is_published', e.target.checked)} className="h-5 w-5 accent-purple" />Published on the site</label>
          <div className="flex gap-2 sm:justify-end"><Button variant="outline" size="sm" onClick={() => setEdit(null)}>Cancel</Button><Button type="submit" variant="purple" size="sm">Save</Button></div>
        </form>
      )}
      {!rows ? <p className="text-ink-soft">Loading…</p> : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="hard-sm flex flex-wrap items-center justify-between gap-3 border-2 border-ink bg-white p-4">
              <div>
                <p className="display text-2xl">{r.title}</p>
                <p className="text-sm text-ink-soft">{formatRange(r.starts_on, r.ends_on)} • {r.city}{r.venue ? ` • ${r.venue}` : ' • venue TBA'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`wide rounded px-2 py-1 text-[9px] ${r.is_published ? 'bg-ok text-white' : 'bg-cream-deep'}`}>{r.is_published ? 'Published' : 'Draft'}</span>
                <Button size="sm" variant="outline" onClick={() => { setEdit({ ...r }); setMsg(null) }}>Edit</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
