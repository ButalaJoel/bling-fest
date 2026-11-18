import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { listApplications } from '../../lib/admin'
import { PARTICIPATION, STATUSES, participationLabel } from '../../config/site'
import { formatDate } from '../../lib/format'
import PageTitle from '../../components/admin/PageTitle'
import StatusBadge from '../../components/admin/StatusBadge'
import Notice from '../../components/ui/Notice'

type Rows = Awaited<ReturnType<typeof listApplications>>

export default function Applications() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') ?? ''
  const participation = params.get('participation') ?? ''
  const page = Number(params.get('page') ?? 0) || 0
  const [q, setQ] = useState(params.get('q') ?? '')
  const [data, setData] = useState<Rows | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    let live = true
    setErr('')
    listApplications({ q: params.get('q') ?? '', status, participation, page })
      .then((d) => live && setData(d)).catch(() => live && setErr('Could not load applications.'))
    return () => { live = false }
  }, [params, status, participation, page])

  const update = (k: string, v: string) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v); else next.delete(k)
    if (k !== 'page') next.delete('page')
    setParams(next)
  }

  const pages = data ? Math.ceil(data.count / data.pageSize) : 0
  const sel = 'border-2 border-ink bg-white px-3 py-2.5 text-sm'

  return (
    <>
      <PageTitle title="Applications">{data && <p className="text-sm text-ink-soft">{data.count} found</p>}</PageTitle>
      <form onSubmit={(e) => { e.preventDefault(); update('q', q.trim()) }} className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <label className="relative">
          <span className="sr-only">Search applicants</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={80} placeholder="Search name, brand, email, phone, reference" className={`${sel} w-full pl-9`} />
        </label>
        <select aria-label="Filter by status" value={status} onChange={(e) => update('status', e.target.value)} className={sel}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select aria-label="Filter by category" value={participation} onChange={(e) => update('participation', e.target.value)} className={sel}>
          <option value="">All categories</option>
          {PARTICIPATION.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </form>

      {err && <Notice tone="bad">{err}</Notice>}
      {!data && !err && <p className="text-ink-soft">Loading…</p>}
      {data && data.rows.length === 0 && <p className="border-2 border-dashed border-ink p-10 text-center text-ink-soft">No applications match.</p>}

      {data && data.rows.length > 0 && (
        <>
          {/* Cards on mobile */}
          <ul className="space-y-3 md:hidden">
            {data.rows.map((r) => (
              <li key={r.id}>
                <Link to={`/admin/applications/${r.id}`} className="hard-sm block border-2 border-ink bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold">{r.brand_name}</p><StatusBadge status={r.status} />
                  </div>
                  <p className="text-sm text-ink-soft">{r.full_name} • {participationLabel(r.participation)}</p>
                  <p className="mt-1 text-xs text-ink-soft">#{r.reference} • {formatDate(r.created_at)}</p>
                </Link>
              </li>
            ))}
          </ul>
          {/* Table on desktop */}
          <div className="hidden overflow-x-auto border-2 border-ink bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink text-cream">
                <tr>{['Brand', 'Applicant', 'Category', 'Submitted', 'Status', ''].map((h) => <th key={h} className="wide px-4 py-3 text-[10px] font-normal">{h}</th>)}</tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.id} className="border-t border-line hover:bg-cream">
                    <td className="px-4 py-3"><p className="font-bold">{r.brand_name}</p><p className="text-xs text-ink-soft">#{r.reference}</p></td>
                    <td className="px-4 py-3"><p>{r.full_name}</p><p className="text-xs text-ink-soft">{r.email}</p></td>
                    <td className="px-4 py-3">{participationLabel(r.participation)}<p className="text-xs text-ink-soft">{r.business_category}</p></td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(r.created_at)}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-right"><Link to={`/admin/applications/${r.id}`} className="font-bold text-purple underline">Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-3 text-sm">
              <button disabled={page === 0} onClick={() => update('page', String(page - 1))} className="border-2 border-ink bg-white p-2 disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
              <span>Page {page + 1} of {pages}</span>
              <button disabled={page + 1 >= pages} onClick={() => update('page', String(page + 1))} className="border-2 border-ink bg-white p-2 disabled:opacity-40" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
            </div>
          )}
        </>
      )}
    </>
  )
}
