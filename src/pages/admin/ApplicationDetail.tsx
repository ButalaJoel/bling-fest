import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ExternalLink, Loader2, Mail, Phone, XCircle } from 'lucide-react'
import { addNote, getApplication, listNotes, setStatus, signedPhotos, type Application, type Note } from '../../lib/admin'
import { STATUSES, participationLabel, type AppStatus } from '../../config/site'
import { formatDateTime, safeUrl, toWaNumber, whatsappLink } from '../../lib/format'
import StatusBadge from '../../components/admin/StatusBadge'
import Button from '../../components/ui/Button'
import Notice from '../../components/ui/Notice'
import WhatsAppIcon from '../../components/ui/WhatsAppIcon'
import { usePageTitle } from '../../lib/usePageTitle'

export default function ApplicationDetail() {
  const { id = '' } = useParams()
  const [app, setApp] = useState<Application | null | undefined>(undefined)
  const [photos, setPhotos] = useState<string[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null)
  const [zoom, setZoom] = useState<string | null>(null)
  usePageTitle(app ? `${app.brand_name} · Admin` : 'Application · Admin')

  const load = useCallback(async () => {
    try {
      const a = await getApplication(id)
      setApp(a)
      if (a) {
        setNotes(await listNotes(id))
        setPhotos(await signedPhotos(a.photo_paths).catch(() => []))
      }
    } catch { setApp(null) }
  }, [id])
  useEffect(() => { load() }, [load])

  async function changeStatus(s: AppStatus) {
    if (!app || s === app.status) return
    if ((s === 'approved' || s === 'rejected') && !window.confirm(`Mark ${app.brand_name} as ${s}?`)) return
    setBusy(s); setMsg(null)
    try {
      await setStatus(app.id, s)
      await load()
      setMsg({ tone: 'ok', text: s === 'approved' ? 'Approved. A hidden vendor profile was created — publish it from Vendors.' : 'Status updated.' })
    } catch {
      setMsg({ tone: 'bad', text: "Couldn't update. Reviewers can add notes but only admins change status." })
    }
    setBusy(null)
  }

  async function onNote(e: FormEvent) {
    e.preventDefault()
    if (!note.trim()) return
    setBusy('note')
    try { await addNote(id, note); setNote(''); setNotes(await listNotes(id)) } catch { setMsg({ tone: 'bad', text: 'Note not saved.' }) }
    setBusy(null)
  }

  if (app === undefined) return <p className="text-ink-soft">Loading…</p>
  if (app === null) return <Notice tone="bad">Application not found.</Notice>
  const social = safeUrl(app.social_link)

  return (
    <>
      <Link to="/admin/applications" className="inline-flex items-center gap-1 text-sm font-bold"><ArrowLeft className="h-4 w-4" /> Applications</Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="wide text-[10px] text-purple">#{app.reference} • {participationLabel(app.participation)}</p>
          <h1 className="display mt-1 text-5xl">{app.brand_name}</h1>
          <p className="text-sm text-ink-soft">Submitted {formatDateTime(app.created_at)}</p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      {msg && <div className="mt-4"><Notice tone={msg.tone}>{msg.text}</Notice></div>}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="hard-sm border-2 border-ink bg-white p-5">
            <h2 className="display text-2xl">Applicant</h2>
            <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <Item k="Full name" v={app.full_name} />
              <Item k="Location" v={app.location} />
              <Item k="Email" v={<a className="inline-flex items-center gap-1 text-purple underline" href={`mailto:${app.email}`}><Mail className="h-3.5 w-3.5" />{app.email}</a>} />
              <Item k="Phone / WhatsApp" v={<span className="flex flex-wrap gap-3"><a className="inline-flex items-center gap-1 underline" href={`tel:${app.phone.replace(/[^\d+]/g, '')}`}><Phone className="h-3.5 w-3.5" />{app.phone}</a><a className="inline-flex items-center gap-1 font-bold text-ok" target="_blank" rel="noopener noreferrer" href={whatsappLink(toWaNumber(app.phone), `Hi ${app.full_name.split(' ')[0]}, this is the Bling Fest team about your application #${app.reference}.`)}><WhatsAppIcon className="h-3.5 w-3.5" />WhatsApp</a></span>} />
              <Item k="Business category" v={app.business_category} />
              <Item k="Social" v={social ? <a className="inline-flex items-center gap-1 break-all text-purple underline" href={social} target="_blank" rel="noopener noreferrer nofollow">{social}<ExternalLink className="h-3 w-3" /></a> : '—'} />
            </dl>
          </section>
          <section className="hard-sm border-2 border-ink bg-white p-5">
            <h2 className="display text-2xl">Business</h2>
            <p className="mt-2 whitespace-pre-line text-sm">{app.description}</p>
            {app.additional_info && <><h3 className="mt-4 text-sm font-bold">Additional information</h3><p className="mt-1 whitespace-pre-line text-sm">{app.additional_info}</p></>}
          </section>
          <section className="hard-sm border-2 border-ink bg-white p-5">
            <h2 className="display text-2xl">Photos ({app.photo_paths.length})</h2>
            {app.photo_paths.length === 0 ? <p className="mt-2 text-sm text-ink-soft">No photos submitted.</p> : (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photos.map((src, i) => (
                  <button key={src} onClick={() => setZoom(src)} className="aspect-square overflow-hidden border-2 border-ink"><img src={src} alt={`Submitted photo ${i + 1}`} className="h-full w-full object-cover" /></button>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="hard-sm border-2 border-ink bg-white p-5">
            <h2 className="display text-2xl">Decision</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="purple" size="sm" onClick={() => changeStatus('under_review')} disabled={!!busy || app.status === 'under_review'}>Under review</Button>
              <Button variant="outline" size="sm" onClick={() => changeStatus('pending')} disabled={!!busy || app.status === 'pending'}>Pending</Button>
              <Button variant="ink" size="sm" className="!bg-ok" onClick={() => changeStatus('approved')} disabled={!!busy || app.status === 'approved'}>
                {busy === 'approved' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Approve
              </Button>
              <Button variant="ink" size="sm" className="!bg-bad" onClick={() => changeStatus('rejected')} disabled={!!busy || app.status === 'rejected'}>
                {busy === 'rejected' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}Reject
              </Button>
            </div>
            <label className="mt-4 block text-xs font-bold">Or set status
              <select value={app.status} onChange={(e) => changeStatus(e.target.value as AppStatus)} disabled={!!busy} className="mt-1 w-full border-2 border-ink bg-white px-3 py-2 text-sm">
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
            {app.reviewed_by && <p className="mt-3 text-xs text-ink-soft">Last changed by {app.reviewed_by}{app.reviewed_at ? ` on ${formatDateTime(app.reviewed_at)}` : ''}</p>}
          </section>

          <section className="hard-sm border-2 border-ink bg-white p-5">
            <h2 className="display text-2xl">Internal notes</h2>
            <p className="text-xs text-ink-soft">Only the admin team sees these.</p>
            <ul className="mt-3 space-y-3">
              {notes.length === 0 && <li className="text-sm text-ink-soft">No notes yet.</li>}
              {notes.map((n) => (
                <li key={n.id} className="border-l-4 border-purple bg-cream p-3 text-sm">
                  <p className="whitespace-pre-line">{n.body}</p>
                  <p className="mt-1 text-[11px] text-ink-soft">{n.author_email ?? 'Admin'} • {formatDateTime(n.created_at)}</p>
                </li>
              ))}
            </ul>
            <form onSubmit={onNote} className="mt-3 space-y-2">
              <label htmlFor="note" className="sr-only">Add a note</label>
              <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} rows={3} placeholder="Add a note…" className="w-full border-2 border-ink px-3 py-2 text-sm" />
              <Button type="submit" variant="ink" size="sm" disabled={busy === 'note' || !note.trim()}>Add note</Button>
            </form>
          </section>
        </div>
      </div>

      {zoom && (
        <div role="dialog" aria-modal="true" aria-label="Photo" className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4" onClick={() => setZoom(null)}>
          <img src={zoom} alt="Submitted photo, enlarged" className="max-h-full max-w-full border-4 border-cream" />
        </div>
      )}
    </>
  )
}

function Item({ k, v }: { k: string; v: React.ReactNode }) {
  return <div><dt className="text-xs font-bold text-ink-soft">{k}</dt><dd className="mt-0.5">{v}</dd></div>
}
