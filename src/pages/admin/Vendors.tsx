import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listVendors, updateVendor, type VendorRow } from '../../lib/admin'
import { participationLabel } from '../../config/site'
import PageTitle from '../../components/admin/PageTitle'
import Notice from '../../components/ui/Notice'

export default function Vendors() {
  const [rows, setRows] = useState<VendorRow[] | null>(null)
  const [err, setErr] = useState('')
  const [filter, setFilter] = useState('')
  const load = () => listVendors().then(setRows).catch(() => setErr('Could not load vendors.'))
  useEffect(() => { load() }, [])

  async function toggle(v: VendorRow, key: 'is_active' | 'is_featured') {
    setErr('')
    try { await updateVendor(v.id, { [key]: !v[key] }); await load() } catch { setErr('Only admins can change vendors.') }
  }

  const cats = [...new Set((rows ?? []).map((r) => r.category))]
  const shown = (rows ?? []).filter((r) => !filter || r.category === filter)

  return (
    <>
      <PageTitle title="Vendors">
        <select aria-label="Filter by category" value={filter} onChange={(e) => setFilter(e.target.value)} className="border-2 border-ink bg-white px-3 py-2 text-sm">
          <option value="">All categories</option>{cats.map((c) => <option key={c}>{c}</option>)}
        </select>
      </PageTitle>
      <p className="mb-4 text-sm text-ink-soft">Approving an application creates a hidden vendor. Turn on <strong>Live</strong> to show it in the marketplace, and <strong>Featured</strong> to promote it.</p>
      {err && <div className="mb-4"><Notice tone="bad">{err}</Notice></div>}
      {!rows ? <p className="text-ink-soft">Loading…</p> : shown.length === 0 ? <p className="border-2 border-dashed border-ink p-10 text-center text-ink-soft">No vendors yet. Approve an application to create one.</p> : (
        <ul className="grid gap-3 md:grid-cols-2">
          {shown.map((v) => (
            <li key={v.id} className="hard-sm border-2 border-ink bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="display truncate text-2xl">{v.name}</p>
                  <p className="text-xs text-ink-soft">{v.category} • {participationLabel(v.participation)}</p>
                  <p className="mt-1 truncate text-xs text-ink-soft">{v.contact_email} • {v.whatsapp}</p>
                </div>
                {v.is_active && <Link to={`/marketplace/${v.slug}`} className="shrink-0 text-xs font-bold text-purple underline">View</Link>}
              </div>
              <div className="mt-3 flex gap-4 text-sm">
                <Toggle label="Live" on={v.is_active} onClick={() => toggle(v, 'is_active')} />
                <Toggle label="Featured" on={v.is_featured} onClick={() => toggle(v, 'is_featured')} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onClick} className="inline-flex items-center gap-2 font-semibold">
      <span className={`relative h-6 w-11 rounded-full border-2 border-ink transition ${on ? 'bg-ok' : 'bg-cream-deep'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-ink transition-all ${on ? 'left-5' : 'left-0.5'}`} />
      </span>{label}
    </button>
  )
}
