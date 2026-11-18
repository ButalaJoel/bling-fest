import PageHero from '../components/layout/PageHero'
import CommunityPreview from '../components/home/Community'
import Container from '../components/ui/Container'
import Notice from '../components/ui/Notice'
import { usePageTitle } from '../lib/usePageTitle'

export default function Community() {
  usePageTitle('Community')
  return (
    <>
      <PageHero kicker="The feed" title="Community" tone="purple"
        intro="New products, artwork, collections, discounts and announcements from the Bling Fest community." />
      <CommunityPreview />
      <Container className="pb-16"><Notice>Posting, likes and comments open for approved vendors in the next phase. Posts shown here are samples.</Notice></Container>
    </>
  )
}
