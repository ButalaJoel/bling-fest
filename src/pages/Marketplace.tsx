import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import PageHero from '../components/layout/PageHero'
import Container from '../components/ui/Container'
import ShowcaseCard from '../components/ui/ShowcaseCard'
import Notice from '../components/ui/Notice'
import { FEATURED_VENDORS } from '../data/showcase'
import { fetchVendors, type PublicVendor } from '../lib/public'
import { participationLabel } from '../config/site'
import { usePageTitle } from '../lib/usePageTitle'

export default function Marketplace() {
  usePageTitle('Marketplace')
  const [vendors, setVendors] = useState<PublicVendor[] | null>(null)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('All')
  useEffect(() => { fetchVendors().then(setVendors) }, [])

  const cats = useMemo(() => ['All', ...new Set([...(vendors ?? []).map((v) => v.category), ...FEATURED_VENDORS.map((f) => f.category)])], [vendors])
  const match = (s: string) => s.toLowerCase().includes(q.trim().toLowerCase())
  const live = (vendors ?? []).filter((v) => (cat === 'All' || v.category === cat) && (match(v.name) || match(v.category) || match(v.bio ?? '')))
  const samples = FEATURED_VENDORS.filter((f) => (cat === 'All' || f.category === cat) && (match(f.title) || match(f.category)))

  return (
    <>
      <PageHero kicker="Pillar 03" title="Creative Market" tone="orange"
        intro="Discover products from independent businesses and contact vendors directly on WhatsApp. No checkout, no middleman." />
      <Container className="py-10 sm:py-14">
        <div className="sticky top-16 z-20 -mx-4 mb-8 space-y-3 border-b-2 border-ink bg-cream/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0">
          <label className="relative block">
            <span className="sr-only">Search products or brands</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-soft" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products or brands" maxLength={80}
              className="w-full border-2 border-ink bg-white py-3 pl-11 pr-4 text-[16px] focus:border-purple focus:outline-none" />
          </label>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c}
                className={`wide shrink-0 border-2 border-ink px-3.5 py-2 text-[11px] ${cat === c ? 'bg-ink text-cream' : 'bg-white'}`}>{c}</button>
            ))}
          </div>
        </div>

        {live.length > 0 && (
          <div className="mb-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {live.map((v) => (
              <Link key={v.id} to={`/marketplace/${v.slug}`} className="hard-sm border-2 border-ink bg-white p-4 hover:-translate-y-0.5 transition">
                <p className="wide text-[10px] text-orange">{v.category}</p>
                <p className="display mt-1 text-3xl">{v.name}</p>
                <p className="mt-1 text-xs text-ink-soft">{participationLabel(v.participation)}{v.location ? ` • ${v.location}` : ''}</p>
              </Link>
            ))}
          </div>
        )}

        <p className="wide mb-4 text-xs text-ink-soft">Preview listings</p>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {samples.map((s) => <ShowcaseCard key={s.id} item={s} />)}
        </div>
        {live.length === 0 && samples.length === 0 && <p className="py-10 text-center text-ink-soft">Nothing matches “{q}”.</p>}
        <div className="mt-10"><Notice>Product listings with prices and photos open as vendors are approved and set up their storefronts.</Notice></div>
      </Container>
    </>
  )
}
