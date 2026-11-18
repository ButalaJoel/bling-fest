import PageHero from '../components/layout/PageHero'
import Pillars from '../components/home/Pillars'
import Welcome from '../components/home/Welcome'
import VendorCTA from '../components/home/VendorCTA'
import Button from '../components/ui/Button'
import { usePageTitle } from '../lib/usePageTitle'

export default function Explore() {
  usePageTitle('Explore')
  return (
    <>
      <PageHero kicker="Discover • Connect • Create • Sell" title="Explore Bling Fest" tone="ink"
        intro="An art exhibition, a fashion runway and a creative market, made for independent creatives and the people who love what they make.">
        <div className="flex flex-wrap gap-3">
          <Button to="/art" variant="purple">Art Exhibition</Button>
          <Button to="/runway" variant="cream">Fashion Runway</Button>
          <Button to="/marketplace">Marketplace</Button>
        </div>
      </PageHero>
      <Pillars />
      <Welcome />
      <VendorCTA />
    </>
  )
}
