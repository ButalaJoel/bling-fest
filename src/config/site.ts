// One place for the facts the whole site repeats. Change them here, not in pages.

export const SITE = {
  name: 'BLING FEST',
  theme: 'CANVAS ALIVE',
  pillars: 'ART EXHIBITION • RUNWAY • MARKET',
  tagline: ['Discover', 'Connect', 'Create', 'Sell'],
  city: 'Kampala, Uganda',
  // Venue is not confirmed yet. Leave null until the organisers confirm it.
  venue: null as string | null,
  dates: { label: '12–13 December 2026', start: '2026-12-12', end: '2026-12-13' },
  // Countdown targets the start of 12 Dec in Kampala time (EAT, UTC+3). No start hour is confirmed.
  countdownTarget: '2026-12-12T00:00:00+03:00',
  instagram: '',
  whatsapp: '',
} as const

export type NavItem = { label: string; to: string }

export const NAV: NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Explore', to: '/explore' },
  { label: 'Art Exhibition', to: '/art' },
  { label: 'Fashion Runway', to: '/runway' },
  { label: 'Marketplace', to: '/marketplace' },
  { label: 'Community', to: '/community' },
  { label: 'Events', to: '/events' },
]

export const PARTICIPATION = [
  { value: 'art_exhibition', label: 'Art Exhibition' },
  { value: 'fashion_runway', label: 'Fashion Runway' },
  { value: 'creative_market', label: 'Creative Market' },
  { value: 'jewellery_accessories', label: 'Jewellery & Accessories' },
  { value: 'beauty_makeup', label: 'Beauty & Makeup' },
  { value: 'other_sme', label: 'Other Small Business / SME' },
] as const

export type Participation = (typeof PARTICIPATION)[number]['value']

export const participationLabel = (v: string) =>
  PARTICIPATION.find((p) => p.value === v)?.label ?? v

export const BUSINESS_CATEGORIES = [
  'Painting & Visual Art',
  'Photography',
  'Illustration & Portraits',
  'Fashion & Apparel',
  'Streetwear',
  'Jewellery & Accessories',
  'Makeup & Beauty',
  'Perfume & Fragrance',
  'Skincare & Cosmetics',
  'Wigs & Hair',
  'Art & Craft / Handmade',
  'Food & Beverage',
  'Gifts',
  'Online Shop',
  'Other',
] as const

export const STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
] as const

export type AppStatus = (typeof STATUSES)[number]['value']
export const statusLabel = (v: string) => STATUSES.find((s) => s.value === v)?.label ?? v
