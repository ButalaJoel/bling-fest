import { CalendarDays, MapPin, Shirt, Sparkles, Users } from 'lucide-react'
import PageHero from '../components/layout/PageHero'
import Container from '../components/ui/Container'
import SectionHeading from '../components/ui/SectionHeading'
import ShowcaseCard from '../components/ui/ShowcaseCard'
import Button from '../components/ui/Button'
import { FEATURED_DESIGNERS } from '../data/showcase'
import { SITE } from '../config/site'
import { usePageTitle } from '../lib/usePageTitle'

const who = [
  { icon: Shirt, t: 'Independent designers', d: 'Clothing, apparel and couture labels.' },
  { icon: Sparkles, t: 'Streetwear & Afro-fusion', d: 'Brands with a point of view.' },
  { icon: Users, t: 'Models', d: 'Runway talent for the showcase.' },
]

export default function FashionRunway() {
  usePageTitle('Fashion Runway')
  return (
    <>
      <PageHero kicker="Pillar 02" title="Fashion Runway" tone="ink"
        intro="Independent designers, streetwear brands and couture labels take the runway at Bling Fest.">
        <Button to="/become-a-vendor?category=fashion_runway">Apply for the runway</Button>
      </PageHero>
      <Container className="grid gap-12 py-14 sm:py-20 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <SectionHeading kicker="Lookbook" title="Collections" />
          {FEATURED_DESIGNERS.map((d) => <ShowcaseCard key={d.id} item={d} wide />)}
        </div>
        <aside className="space-y-6">
          <div className="hard border-2 border-ink bg-white p-6">
            <p className="display text-3xl">Runway info</p>
            <ul className="mt-4 space-y-2 text-[15px]">
              <li className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-purple" />{SITE.dates.label}</li>
              <li className="flex items-center gap-2"><MapPin className="h-5 w-5 text-orange" />{SITE.city} — venue to be announced</li>
            </ul>
            <p className="mt-4 text-sm text-ink-soft">Show times, look counts and participation details will be shared with selected designers.</p>
          </div>
          <ul className="space-y-4">
            {who.map((w) => (
              <li key={w.t} className="flex gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-ink bg-orange"><w.icon className="h-5 w-5" /></span>
                <div><p className="font-bold">{w.t}</p><p className="text-sm text-ink-soft">{w.d}</p></div>
              </li>
            ))}
          </ul>
        </aside>
      </Container>
    </>
  )
}
