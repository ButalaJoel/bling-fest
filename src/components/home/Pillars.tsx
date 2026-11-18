import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { PILLARS } from '../../data/showcase'
import Container from '../ui/Container'
import SectionHeading from '../ui/SectionHeading'

const tone = {
  purple: 'bg-purple text-cream',
  ink: 'bg-ink text-cream',
  orange: 'bg-orange text-ink',
}

export default function Pillars() {
  return (
    <section className="py-16 sm:py-24">
      <Container>
        <SectionHeading kicker="Three stages, one weekend" title={<>The <span className="text-purple">experience</span></>}
          intro="An art exhibition, a fashion runway and an open creative market — all under one roof in Kampala." />
        <div className="grid gap-6 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <Link key={p.key} to={p.to} className={`group hard relative flex flex-col overflow-hidden border-2 border-ink transition hover:-translate-y-1 ${tone[p.tone]}`}>
              <div className="relative aspect-[4/3] overflow-hidden border-b-2 border-ink">
                <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <span className="absolute bottom-2 right-2 rounded bg-ink/85 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cream">Placeholder</span>
                <span className="display absolute left-3 top-2 text-6xl text-cream [text-shadow:3px_3px_0_var(--color-ink)]">0{i + 1}</span>
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <h3 className="display text-4xl sm:text-5xl">{p.title}</h3>
                <ul className="mt-4 flex-1 space-y-1.5 text-[15px] opacity-90">
                  {p.points.map((pt) => <li key={pt}>— {pt}</li>)}
                </ul>
                <span className="wide mt-5 inline-flex items-center gap-1 text-xs">Explore <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  )
}
