import { useEffect, useState } from 'react'
import { CalendarDays, MapPin, Megaphone } from 'lucide-react'
import PageHero from '../components/layout/PageHero'
import Container from '../components/ui/Container'
import SectionHeading from '../components/ui/SectionHeading'
import Countdown from '../components/ui/Countdown'
import Button from '../components/ui/Button'
import { FALLBACK_EVENT, fetchAnnouncements, fetchEvents, formatRange, type Announcement, type EventRow } from '../lib/public'
import { formatDate } from '../lib/format'
import { SITE } from '../config/site'
import { usePageTitle } from '../lib/usePageTitle'

const activities = [
  { t: 'Art Exhibition', d: 'Gallery walk, artist meet-and-greets and artwork enquiries.', c: 'bg-purple text-cream' },
  { t: 'Fashion Runway', d: 'Runway showcases from independent designers and models.', c: 'bg-ink text-cream' },
  { t: 'Creative Market', d: 'Shop directly from jewellery, beauty, food, gift and handmade vendors.', c: 'bg-orange text-ink' },
]

export default function Events() {
  usePageTitle('Events')
  const [events, setEvents] = useState<EventRow[]>([FALLBACK_EVENT])
  const [news, setNews] = useState<Announcement[]>([])
  useEffect(() => { fetchEvents().then(setEvents); fetchAnnouncements().then(setNews) }, [])
  const [main, ...more] = events

  return (
    <>
      <PageHero kicker="What's on" title="Events" tone="ink" intro={main.theme} />
      <Container className="py-14 sm:py-20">
        <div className="hard grid gap-8 border-2 border-ink bg-white p-6 sm:p-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="wide text-xs text-purple">Next edition</p>
            <h2 className="display mt-2 text-6xl">{main.title}</h2>
            <ul className="mt-5 space-y-2 text-lg">
              <li className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-purple" />{formatRange(main.starts_on, main.ends_on)}</li>
              <li className="flex items-center gap-2"><MapPin className="h-5 w-5 text-orange" />{main.city}{main.venue ? ` — ${main.venue}` : ' — venue to be announced'}</li>
            </ul>
            {main.summary && <p className="mt-5 text-ink-soft">{main.summary}</p>}
            <Button to="/become-a-vendor" className="mt-6">Become a Vendor</Button>
          </div>
          <div className="self-center"><p className="wide mb-2 text-[11px] text-ink-soft">Countdown</p><Countdown target={SITE.countdownTarget} /></div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {activities.map((a) => (
            <div key={a.t} className={`hard-sm border-2 border-ink p-6 ${a.c}`}>
              <p className="display text-4xl">{a.t}</p>
              <p className="mt-2 opacity-90">{a.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading kicker="Latest" title="Announcements" />
            {news.length === 0 ? <p className="text-ink-soft">No announcements yet. Check back soon.</p> : (
              <ul className="space-y-4">
                {news.map((n) => (
                  <li key={n.id} className="border-l-4 border-orange bg-white p-4">
                    <p className="flex items-center gap-2 font-bold"><Megaphone className="h-4 w-4 text-orange" />{n.title}</p>
                    <p className="mt-1 whitespace-pre-line text-sm">{n.body}</p>
                    <p className="mt-2 text-xs text-ink-soft">{formatDate(n.published_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <SectionHeading kicker="Coming up" title="Future editions" />
            {more.length === 0 ? <p className="text-ink-soft">Monthly Bling Fest editions will be listed here once dates are confirmed.</p> : (
              <ul className="space-y-3">
                {more.map((e) => (
                  <li key={e.id} className="hard-sm border-2 border-ink bg-white p-4">
                    <p className="display text-3xl">{e.title}</p>
                    <p className="text-sm text-ink-soft">{formatRange(e.starts_on, e.ends_on)} • {e.city}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Container>
    </>
  )
}
