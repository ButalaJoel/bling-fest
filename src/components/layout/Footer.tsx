import { Link } from 'react-router-dom'
import { NAV, SITE } from '../../config/site'
import Container from '../ui/Container'
import Wordmark from './Wordmark'
import { Starburst } from '../ui/Shapes'

const YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink text-cream">
      <Starburst className="absolute -right-16 -top-16 h-56 w-56 text-purple/40" />
      <Container className="relative grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Wordmark light className="text-5xl sm:text-5xl" />
          <p className="wide mt-3 text-xs text-orange">{SITE.theme}</p>
          <p className="mt-4 max-w-sm text-sm text-cream/70">
            Where independent creatives, artists, designers and small businesses meet their customers.
          </p>
          <p className="wide mt-6 text-[11px] text-cream/90">{SITE.tagline.join(' • ')}</p>
        </div>
        <div>
          <p className="wide mb-4 text-[11px] text-cream/60">Explore</p>
          <ul className="space-y-2 text-sm">
            {NAV.map((n) => <li key={n.to}><Link to={n.to} className="hover:text-orange">{n.label}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className="wide mb-4 text-[11px] text-cream/60">Take part</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/become-a-vendor" className="hover:text-orange">Become a Vendor</Link></li>
            <li><Link to="/become-a-vendor?category=fashion_runway" className="hover:text-orange">Apply for the Runway</Link></li>
            <li><Link to="/become-a-vendor?category=art_exhibition" className="hover:text-orange">Exhibit your Art</Link></li>
            <li><Link to="/sign-in" className="hover:text-orange">Sign In</Link></li>
          </ul>
          <p className="mt-6 text-sm text-cream/70">{SITE.dates.label}<br />{SITE.city}<br /><span className="text-cream/50">Venue to be announced</span></p>
        </div>
      </Container>
      <div className="border-t border-cream/10">
        <Container className="flex flex-col gap-2 py-5 text-xs text-cream/50 sm:flex-row sm:justify-between">
          <p>© {YEAR} Bling Fest. Kampala, Uganda.</p>
          <p>Photos marked "Placeholder" are temporary campaign imagery.</p>
        </Container>
      </div>
    </footer>
  )
}
