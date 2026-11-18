import { ArrowRight } from 'lucide-react'
import { FEATURED_ART, FEATURED_DESIGNERS, FEATURED_VENDORS, type ShowcaseItem } from '../../data/showcase'
import Container from '../ui/Container'
import SectionHeading from '../ui/SectionHeading'
import Button from '../ui/Button'
import ShowcaseCard from '../ui/ShowcaseCard'
import OpenSlotCard from '../ui/OpenSlotCard'

export default function Featured() {
  return (
    <section className="py-16 sm:py-24">
      <Container className="space-y-20">
        <div>
          <SectionHeading kicker="Art Exhibition" title={<>Featured <span className="text-purple">artists</span></>}
            intro="Portraits, canvas, mixed media and photography from independent artists."
            action={<Button to="/art" variant="outline" size="sm">View the exhibition <ArrowRight className="h-4 w-4" /></Button>} />
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {FEATURED_ART.map((it) => <ShowcaseCard key={it.id} item={it} />)}
            <OpenSlotCard title="Your work here" text="Painters, illustrators and photographers — apply to exhibit." to="/become-a-vendor?category=art_exhibition" />
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:items-center">
          <div>
            <SectionHeading kicker="Fashion Runway" title={<>Featured <span className="text-orange">designers</span></>}
              intro="Streetwear, couture and Afro-fusion — independent designers take the runway." />
            <Button to="/become-a-vendor?category=fashion_runway" variant="ink">Apply for the runway</Button>
          </div>
          {FEATURED_DESIGNERS.map((d) => <ShowcaseCard key={d.id} item={d} wide />)}
        </div>

        <div>
          <SectionHeading kicker="Creative Market" title={<>Featured <span className="text-magenta">vendors</span></>}
            intro="Jewellery, perfume, skincare and more from small businesses across Kampala."
            action={<Button to="/marketplace" variant="outline" size="sm">Browse the market <ArrowRight className="h-4 w-4" /></Button>} />
          <Grid items={FEATURED_VENDORS} cols="grid-cols-2 lg:grid-cols-4" />
        </div>
      </Container>
    </section>
  )
}

function Grid({ items, cols }: { items: ShowcaseItem[]; cols: string }) {
  return <div className={`grid gap-4 sm:gap-6 ${cols}`}>{items.map((it) => <ShowcaseCard key={it.id} item={it} />)}</div>
}
