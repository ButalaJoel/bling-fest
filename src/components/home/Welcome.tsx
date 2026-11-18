import { MARKET_CATEGORIES } from '../../data/showcase'
import Container from '../ui/Container'
import Button from '../ui/Button'
import { Halftone } from '../ui/Shapes'

const chip = ['bg-purple text-cream', 'bg-orange text-ink', 'bg-cream text-ink', 'bg-magenta text-cream']

export default function Welcome() {
  return (
    <section className="relative overflow-hidden bg-ink py-16 text-cream sm:py-24">
      <Halftone className="right-0 top-0 h-full w-1/2" color="rgba(129,0,215,0.55)" size={10} />
      <Container className="relative grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div>
          <p className="wide mb-3 text-xs text-orange">Not just artists. Not just fashion.</p>
          <h2 className="display text-5xl sm:text-6xl lg:text-7xl">Every small business is <span className="text-orange">welcome</span></h2>
          <p className="mt-5 max-w-lg text-cream/75 sm:text-lg">
            Start-up or established, online shop or market stall, student or SME — Bling Fest puts you in front of new customers.
          </p>
          <Button to="/become-a-vendor" className="mt-7" size="lg">Register to sell</Button>
        </div>
        <ul className="flex flex-wrap gap-2.5 sm:gap-3">
          {MARKET_CATEGORIES.map((c, i) => (
            <li key={c} className={`wide hard-sm border-2 border-ink px-4 py-2.5 text-xs sm:text-sm ${chip[i % chip.length]}`}
              style={{ transform: `rotate(${(i % 3) - 1}deg)` }}>{c}</li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
