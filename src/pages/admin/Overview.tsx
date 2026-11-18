import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchStats, type Stats } from '../../lib/admin'
import { PARTICIPATION, STATUSES } from '../../config/site'
import PageTitle from '../../components/admin/PageTitle'
import Notice from '../../components/ui/Notice'

const tone: Record<string, string> = { pending: 'bg-cream-deep', under_review: 'bg-purple text-cream', approved: 'bg-ok text-white', rejected: 'bg-bad text-white' }

export default function Overview() {
  const [s, setS] = useState<Stats | null>(null)
  const [err, setErr] = useState('')
  useEffect(() => { fetchStats().then(setS).catch(() => setErr('Could not load the numbers.')) }, [])

  if (err) return <Notice tone="bad">{err}</Notice>
  if (!s) return <p className="text-ink-soft">Loading…</p>
  const max = Math.max(1, ...Object.values(s.by_participation))

  return (
    <>
      <PageTitle title="Overview" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <Link to="/admin/applications" className="hard-sm col-span-2 border-2 border-ink bg-ink p-5 text-cream lg:col-span-1">
          <p className="wide text-[10px] text-orange">Total applications</p>
          <p className="display mt-2 text-6xl">{s.total}</p>
        </Link>
        {STATUSES.map((st) => (
          <Link key={st.value} to={`/admin/applications?status=${st.value}`} className={`hard-sm border-2 border-ink p-5 ${tone[st.value]}`}>
            <p className="wide text-[10px] opacity-80">{st.label}</p>
            <p className="display mt-2 text-5xl">{s.by_status[st.value] ?? 0}</p>
          </Link>
        ))}
      </div>

      <section className="hard-sm mt-8 border-2 border-ink bg-white p-5 sm:p-6">
        <h2 className="display text-3xl">Applications by category</h2>
        <ul className="mt-5 space-y-3">
          {PARTICIPATION.map((p) => {
            const n = s.by_participation[p.value] ?? 0
            return (
              <li key={p.value}>
                <Link to={`/admin/applications?participation=${p.value}`} className="grid grid-cols-[minmax(0,10rem)_1fr_2.5rem] items-center gap-3 text-sm hover:text-purple">
                  <span className="truncate font-semibold">{p.label}</span>
                  <span className="h-3 bg-cream-deep"><span className="block h-full bg-purple" style={{ width: `${(n / max) * 100}%` }} /></span>
                  <span className="text-right font-bold tabular-nums">{n}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </>
  )
}
