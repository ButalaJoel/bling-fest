import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import { SITE } from '../../config/site'
import Container from '../ui/Container'
import Button from '../ui/Button'
import Sticker from '../ui/Sticker'
import Countdown from '../ui/Countdown'
import PhotoPrint from '../ui/PhotoPrint'
import { Halftone, Sparkle, Starburst } from '../ui/Shapes'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream">
      {/* Flyer colour blocks: purple sweep behind the collage, orange wedge bottom-left. */}
      <div aria-hidden="true" className="absolute inset-x-0 top-[52%] h-[38%] -skew-y-6 bg-purple lg:left-[44%] lg:top-[18%] lg:h-[70%] lg:skew-y-0 lg:[clip-path:polygon(18%_0,100%_0,100%_100%,0_100%)]" />
      <div aria-hidden="true" className="absolute -bottom-10 -left-10 hidden h-48 w-72 rotate-6 bg-orange lg:block" />
      <Halftone className="left-0 top-0 h-48 w-48 opacity-60" size={8} />
      <Halftone className="bottom-0 right-0 h-72 w-96 rotate-180" size={10} color="rgba(25,22,34,0.85)" />

      <Container className="relative grid grid-cols-1 gap-10 pb-16 pt-8 sm:pt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pb-24 lg:pt-16">
        <div className="anim-rise relative z-10 min-w-0">
          <p className="wide text-[13px] text-ink sm:text-base">Kampala's creative market</p>
          <h1 className="display mt-2 text-[27vw] sm:text-[150px] lg:text-[168px] xl:text-[190px]">
            <span className="poster-word block">Bling</span>
            <span className="poster-word poster-word--orange -mt-[0.06em] block">Fest</span>
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Sticker tone="ink" tilt={-2} className="!text-sm sm:!text-base">{SITE.theme}</Sticker>
            <Sticker tone="orange" tilt={2}>Art Exhibition • Runway • Market</Sticker>
          </div>
          <dl className="mt-6 flex flex-col gap-2 text-[15px] font-semibold sm:flex-row sm:gap-6">
            <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-purple" /><dt className="sr-only">Date</dt><dd>{SITE.dates.label}</dd></div>
            <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-orange" /><dt className="sr-only">Location</dt><dd>{SITE.city}</dd></div>
          </dl>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button to="/explore" variant="purple" size="lg">Explore the Experience <ArrowRight className="h-4 w-4" /></Button>
            <Button to="/become-a-vendor" size="lg">Become a Vendor</Button>
          </div>
          <div className="mt-8">
            <p className="wide mb-2 text-[11px] text-ink-soft">Countdown to opening day</p>
            <Countdown target={SITE.countdownTarget} />
          </div>
        </div>

        {/* Collage */}
        <div className="relative mx-auto aspect-[1/1.02] w-full max-w-[560px] lg:mt-6">
          <Starburst className="absolute left-[4%] top-[2%] h-24 w-24 text-orange sm:h-32 sm:w-32" />
          <Starburst className="absolute bottom-[6%] right-[0%] h-20 w-20 text-magenta" points={10} />
          <PhotoPrint src="/media/crew.jpg" alt="Young Kampala creatives in streetwear and statement accessories" tilt={-2}
            className="absolute left-[9%] top-[9%] w-[82%]" imgClassName="aspect-[1.8/1]" placeholder />
          <PhotoPrint src="/media/bracelets.jpg" alt="Handmade beaded bracelets" tilt={-8} className="absolute -left-[2%] bottom-[13%] w-[30%]" />
          <PhotoPrint src="/media/portraits.jpg" alt="Colourful painted portraits" tilt={3} className="absolute bottom-[3%] left-[30%] w-[42%]" imgClassName="aspect-[2.1/1]" />
          <PhotoPrint src="/media/perfume-set.jpg" alt="Perfume bottles" tilt={7} className="absolute bottom-[14%] right-[1%] w-[28%]" />
          <Sparkle className="absolute right-[10%] top-[3%] h-10 w-10 text-purple" />
          <div className="absolute left-[16%] top-[52%] -rotate-3 bg-ink px-3 py-2">
            <p className="display text-xl text-cream sm:text-3xl">Kampala • Coming soon</p>
          </div>
        </div>
      </Container>
    </section>
  )
}
