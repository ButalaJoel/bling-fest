import Hero from '../components/home/Hero'
import Ribbon from '../components/home/Ribbon'
import Pillars from '../components/home/Pillars'
import Welcome from '../components/home/Welcome'
import Featured from '../components/home/Featured'
import CommunityPreview from '../components/home/Community'
import EventInfo from '../components/home/EventInfo'
import VendorCTA from '../components/home/VendorCTA'
import { usePageTitle } from '../lib/usePageTitle'

export default function Home() {
  usePageTitle('')
  return (
    <>
      <Hero />
      <Ribbon />
      <Pillars />
      <Welcome />
      <Featured />
      <CommunityPreview />
      <EventInfo />
      <VendorCTA />
    </>
  )
}
