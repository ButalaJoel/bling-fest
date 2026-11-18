import { useEffect, useState, type FormEvent } from 'react'
import { deleteAnnouncement, listAnnouncements, saveAnnouncement, type AdminAnnouncement } from '../../lib/admin'
import { formatDate } from '../../lib/format'
import PageTitle from '../../components/admin/PageTitle'
import Button from '../../components/ui/Button'
import Notice from '../../components/ui/Notice'
import { TextArea, TextInput } from '../../components/forms/Field'

type Draft = { id?: string; title: string; body: string; is_published: boolean }

export default function Announcements() {
  const [rows, setRows] = useState<AdminAnnouncement[] | null>(null)
  const [edit, setEdit] = useState<Draft | null>(null)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null)
  const load = () => listAnnouncements().then(setRows).catch(() => setMsg({ tone: 'bad', text: 'Could not load announcements.' }))
  useEffect(() => { load() }, [])

  async function onSave(e: FormEvent) {
    e.preventDefault()
    if (!edit) return
    if (edit.title.trim().length < 2 || !edit.body.trim()) return setMsg({ tone: 'bad', text: 'Add a title and a message.' })
    try { await saveAnnouncement(edit); setEdit(null); setMsg({ tone: 'ok', text: 'Saved.' }); load() }
    catch { setMsg({ tone: 'bad', text: 'Not saved (reviewers cannot publish).' }) }
  }
  async function onDelete(a: AdminAnnouncement) {
    if (!window.confirm(`Delete "${a.title}"?`)) return
    try { await deleteAnnouncement(a.id); load() } catch { setMsg({ tone: 'bad', text: 'Not deleted.' }) }
  }

  return (
    <>
      <PageTitle title="Announcements"><Button size="sm" onClick={() => { setEdit({ title: '', body: '', is_published: true }); setMsg(null) }}>New announcement</Button></PageTitle>
      {msg && <div className="mb-4"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
      {edit && (
        <form onSubmit={onSave} className="hard-sm mb-8 space-y-4 border-2 border-ink bg-white p-5">
          <TextInput label="Title" name="title" required maxLength={160} value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
          <TextArea label="Message" name="body" required maxLength={4000} rows={5} value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} />
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={edit.is_published} onChange={(e) => setEdit({ ...edit, is_published: e.target.checked })} className="h-5 w-5 accent-purple" />Published on the Events page</label>
          <div className="flex gap-2"><Button type="submit" variant="purple" size="sm">Save</Button><Button variant="outline" size="sm" onClick={() => setEdit(null)}>Cancel</Button></div>
        </form>
      )}
      {!rows ? <p className="text-ink-soft">Loading…</p> : rows.length === 0 ? <p className="border-2 border-dashed border-ink p-10 text-center text-ink-soft">No announcements yet.</p> : (
        <ul className="space-y-3">
          {rows.map((a) => (
            <li key={a.id} className="hard-sm border-2 border-ink bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><p className="font-bold">{a.title}</p><p className="text-xs text-ink-soft">{formatDate(a.published_at)} • {a.is_published ? 'Published' : 'Draft'}</p></div>
                <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setEdit(a)}>Edit</Button><Button size="sm" variant="outline" onClick={() => onDelete(a)}>Delete</Button></div>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm">{a.body}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
