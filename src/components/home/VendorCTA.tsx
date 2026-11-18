import { ArrowRight } from 'lucide-react'
import Container from '../ui/Container'
import Button from '../ui/Button'
import { Halftone, Starburst } from '../ui/Shapes'

/** The flyer's closing block: VENDORS WANTED / REGISTER TO SELL. */
export default function VendorCTA() {
  return (
    <section className="relative overflow-hidden border-t-2 border-ink bg-orange">
      <Halftone className="left-0 top-0 h-full w-2/3" color="rgba(25,22,34,0.35)" size={10} />
      <Starburst className="absolute -right-10 -top-12 h-52 w-52 text-purple sm:h-72 sm:w-72" />
      <Container className="relative py-16 text-center sm:py-24">
        <h2 className="display text-[19vw] text-ink sm:text-[120px] lg:text-[150px]">Vendors wanted</h2>
        <p className="wide mx-auto mt-3 inline-block -rotate-1 bg-ink px-5 py-3 text-base text-orange sm:text-2xl">Register to sell</p>
        <p className="mx-auto mt-6 max-w-xl text-ink sm:text-lg">Artists, designers, beauty brands, food vendors and every kind of small business. Applications are reviewed by the Bling Fest team.</p>
        <Button to="/become-a-vendor" variant="ink" size="lg" className="mt-8">Start your application <ArrowRight className="h-4 w-4" /></Button>
      </Container>
    </section>
  )
}
