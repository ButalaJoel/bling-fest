import type { ReactNode } from 'react'
import Container from '../ui/Container'
import Sticker from '../ui/Sticker'
import { Halftone, Starburst } from '../ui/Shapes'

type Tone = 'purple' | 'orange' | 'ink'
const bg: Record<Tone, string> = { purple: 'bg-purple', orange: 'bg-orange', ink: 'bg-ink' }

/** Shared hero for inner pages: colour block, poster headline, halftone + starburst. */
export default function PageHero({ kicker, title, intro, tone = 'purple', children }:
  { kicker: string; title: string; intro?: ReactNode; tone?: Tone; children?: ReactNode }) {
  return (
    <section className={`relative overflow-hidden ${bg[tone]} text-cream`}>
      <Halftone className="inset-y-0 right-0 w-2/3" color="rgba(255,246,223,0.22)" size={11} />
      <Starburst className={`absolute -bottom-10 right-6 h-40 w-40 sm:h-56 sm:w-56 ${tone === 'orange' ? 'text-purple' : 'text-orange'}`} />
      <Container className="relative py-14 sm:py-20">
        <Sticker tone={tone === 'ink' ? 'orange' : 'ink'}>{kicker}</Sticker>
        <h1 className="display poster-word mt-5 max-w-4xl text-6xl sm:text-7xl lg:text-8xl" style={{ ['--stroke-color' as string]: 'var(--color-ink)' }}>{title}</h1>
        {intro && <div className="mt-5 max-w-2xl text-base text-cream/85 sm:text-lg">{intro}</div>}
        {children && <div className="mt-7">{children}</div>}
      </Container>
    </section>
  )
}
