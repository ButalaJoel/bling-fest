import { useState } from 'react'
import PageHero from '../components/layout/PageHero'
import Container from '../components/ui/Container'
import SectionHeading from '../components/ui/SectionHeading'
import ShowcaseCard from '../components/ui/ShowcaseCard'
import OpenSlotCard from '../components/ui/OpenSlotCard'
import Button from '../components/ui/Button'
import Notice from '../components/ui/Notice'
import { FEATURED_ART } from '../data/showcase'
import { usePageTitle } from '../lib/usePageTitle'

const CATS = ['All', 'Painting', 'Portraits & Illustration', 'Mixed Media', 'Photography', 'Craft & Sculpture']

export default function ArtExhibition() {
  usePageTitle('Art Exhibition')
  const [cat, setCat] = useState('All')
  return (
    <>
      <PageHero kicker="Pillar 01" title="Art Exhibition" tone="purple"
        intro="Painters, portrait artists, illustrators and photographers show their work. Meet the artists and enquire about buying pieces.">
        <Button to="/become-a-vendor?category=art_exhibition">Exhibit your art</Button>
      </PageHero>
      <Container className="py-14 sm:py-20">
        <SectionHeading kicker="The gallery" title="On the walls" />
        <div className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="Art categories">
          {CATS.map((c) => (
            <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)}
              className={`wide shrink-0 border-2 border-ink px-4 py-2 text-xs ${cat === c ? 'bg-purple text-cream' : 'bg-white'}`}>{c}</button>
          ))}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_ART.map((a) => <ShowcaseCard key={a.id} item={a} />)}
          <OpenSlotCard title="Your work here" text="Apply to exhibit your art at Bling Fest." to="/become-a-vendor?category=art_exhibition" />
        </div>
        <div className="mt-10"><Notice>Artist profiles, full galleries and artwork enquiries go live as artists are approved. Approved artists will upload and manage their own work.</Notice></div>
      </Container>
    </>
  )
}
