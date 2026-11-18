import { CalendarDays, MapPin, Palette, Shirt, Store } from 'lucide-react'
import { SITE } from '../../config/site'
import Container from '../ui/Container'
import SectionHeading from '../ui/SectionHeading'
import Countdown from '../ui/Countdown'
import Button from '../ui/Button'

const happening = [
  { icon: Palette, title: 'Art Exhibition', text: 'Walk the gallery, meet the artists and enquire about pieces.' },
  { icon: Shirt, title: 'Fashion Runway', text: 'Independent designers and models showcase new collections.' },
  { icon: Store, title: 'Creative Market', text: 'Shop direct from jewellery, beauty, food and handmade vendors.' },
]

export default function EventInfo() {
  return (
    <section className="py-16 sm:py-24">
      <Container className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <div>
          <SectionHeading kicker="Upcoming event" title={<>Save the <span className="text-orange">date</span></>} />
          <div className="hard border-2 border-ink bg-white p-5 sm:p-7">
            <p className="display text-4xl sm:text-5xl">{SITE.name}: {SITE.theme}</p>
            <ul className="mt-5 space-y-3 text-[15px]">
              <li className="flex items-center gap-3"><CalendarDays className="h-5 w-5 text-purple" /> {SITE.dates.label}</li>
              <li className="flex items-center gap-3"><MapPin className="h-5 w-5 text-orange" /> {SITE.city} — <span className="text-ink-soft">venue to be announced</span></li>
            </ul>
            <div className="mt-6"><Countdown target={SITE.countdownTarget} /></div>
            <Button to="/events" variant="ink" className="mt-6">Event details</Button>
          </div>
        </div>
        <ol className="space-y-4 lg:pt-28">
          {happening.map((h, i) => (
            <li key={h.title} className="flex gap-4 border-b-2 border-ink pb-4">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center border-2 border-ink ${['bg-purple text-cream', 'bg-ink text-cream', 'bg-orange text-ink'][i]}`}><h.icon className="h-6 w-6" /></span>
              <div>
                <h3 className="display text-3xl">{h.title}</h3>
                <p className="text-ink-soft">{h.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
