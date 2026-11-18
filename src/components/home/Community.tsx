import { Heart, MessageCircle } from 'lucide-react'
import { SAMPLE_POSTS } from '../../data/showcase'
import Container from '../ui/Container'
import SectionHeading from '../ui/SectionHeading'
import Button from '../ui/Button'

export default function CommunityPreview() {
  return (
    <section className="bg-cream-deep py-16 sm:py-24">
      <Container>
        <SectionHeading kicker="Community" title={<>What's <span className="text-purple">new</span></>}
          intro="Approved vendors post new products, artwork, collections and offers here."
          action={<Button to="/community" variant="outline" size="sm">Open the feed</Button>} />
        <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0">
          {SAMPLE_POSTS.map((p) => (
            <article key={p.id} className="hard-sm w-[80vw] max-w-sm shrink-0 snap-start border-2 border-ink bg-white sm:w-auto sm:max-w-none">
              <header className="flex items-center gap-3 p-3">
                <span className="display flex h-10 w-10 items-center justify-center rounded-full bg-purple text-lg text-cream">{p.author[0]}</span>
                <div>
                  <p className="text-sm font-bold">{p.author}</p>
                  <p className="wide text-[9px] text-orange">{p.kind}</p>
                </div>
                {p.id !== 'p1' && <span className="ml-auto rounded bg-ink px-1.5 py-0.5 text-[9px] font-bold uppercase text-cream">Sample</span>}
              </header>
              <img src={p.image} alt="" loading="lazy" className="aspect-[4/3] w-full border-y-2 border-ink object-cover" />
              <p className="p-3 text-sm">{p.body}</p>
              <footer className="flex gap-4 px-3 pb-3 text-xs text-ink-soft">
                <span className="inline-flex items-center gap-1"><Heart className="h-4 w-4" /> Like</span>
                <span className="inline-flex items-center gap-1"><MessageCircle className="h-4 w-4" /> Comment</span>
              </footer>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
