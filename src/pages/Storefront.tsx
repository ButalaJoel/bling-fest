import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, MapPin } from 'lucide-react'
import Container from '../components/ui/Container'
import Button from '../components/ui/Button'
import WhatsAppIcon from '../components/ui/WhatsAppIcon'
import { fetchVendor, type PublicVendor } from '../lib/public'
import { safeUrl, toWaNumber, whatsappLink } from '../lib/format'
import { participationLabel } from '../config/site'
import { usePageTitle } from '../lib/usePageTitle'

export default function Storefront() {
  const { slug = '' } = useParams()
  const [v, setV] = useState<PublicVendor | null | undefined>(undefined)
  useEffect(() => { fetchVendor(slug).then(setV) }, [slug])
  usePageTitle(v?.name ?? 'Vendor')

  if (v === undefined) return <Container className="py-20 text-center">Loading…</Container>
  if (v === null) return (
    <Container className="py-20 text-center">
      <p className="display text-5xl">Vendor not found</p>
      <Button to="/marketplace" variant="ink" className="mt-6">Back to the market</Button>
    </Container>
  )
  const social = safeUrl(v.social_link)
  return (
    <Container className="py-10 sm:py-14">
      <Link to="/marketplace" className="inline-flex items-center gap-1 text-sm font-bold"><ArrowLeft className="h-4 w-4" /> Marketplace</Link>
      <div className="hard mt-6 border-2 border-ink bg-white p-6 sm:p-10">
        <p className="wide text-xs text-orange">{v.category} • {participationLabel(v.participation)}</p>
        <h1 className="display mt-2 text-6xl sm:text-7xl">{v.name}</h1>
        {v.location && <p className="mt-2 flex items-center gap-1.5 text-ink-soft"><MapPin className="h-4 w-4" />{v.location}</p>}
        {v.bio && <p className="mt-5 max-w-2xl whitespace-pre-line text-lg">{v.bio}</p>}
        <div className="mt-7 flex flex-wrap gap-3">
          {v.whatsapp && (
            <Button href={whatsappLink(toWaNumber(v.whatsapp), `Hi ${v.name}, I found you on Bling Fest.`)} className="!bg-[#25D366] !text-ink">
              <WhatsAppIcon className="h-5 w-5" /> Chat on WhatsApp
            </Button>
          )}
          {social && <Button href={social} variant="outline"><ExternalLink className="h-4 w-4" /> Social</Button>}
        </div>
      </div>
      <p className="mt-8 text-sm text-ink-soft">Products and photos appear here once the vendor sets up their storefront.</p>
    </Container>
  )
}
