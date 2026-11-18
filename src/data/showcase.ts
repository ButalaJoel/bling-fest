// TEMPORARY showcase content for the homepage and section pages.
// Images are cut from the Bling Fest "Vendors Wanted" flyer. Names are deliberately generic
// ("to be announced"). Replace with approved vendors from the database as they are confirmed.

export type ShowcaseItem = {
  id: string
  title: string
  by: string
  category: string
  image: string
  blurb: string
}

export const PILLARS = [
  {
    key: 'art',
    title: 'Art Exhibition',
    to: '/art',
    image: '/media/portraits.jpg',
    tone: 'purple' as const,
    points: ['Painters & visual artists', 'Portraits & illustration', 'Canvas & mixed media', 'Photography'],
  },
  {
    key: 'runway',
    title: 'Fashion Runway',
    to: '/runway',
    image: '/media/crew.jpg',
    tone: 'ink' as const,
    points: ['Independent designers', 'Streetwear & Afro-fusion', 'Couture & apparel', 'Accessories & jewellery'],
  },
  {
    key: 'market',
    title: 'Creative Market',
    to: '/marketplace',
    image: '/media/perfume-set.jpg',
    tone: 'orange' as const,
    points: ['Jewellery & beauty', 'Perfume & skincare', 'Food, gifts & handmade', 'Online sellers & SMEs'],
  },
]

export const MARKET_CATEGORIES = [
  'Jewellery & Accessories', 'Makeup & Beauty', 'Perfume', 'Skincare & Cosmetics', 'Wigs & Hair',
  'Art & Craft', 'Clothing & Fashion', 'Food & Beverage', 'Gift Shops', 'Handmade', 'Online Sellers', 'Every SME',
]

export const FEATURED_ART: ShowcaseItem[] = [
  { id: 'a1', title: 'Portrait Series', by: 'Artist to be announced', category: 'Acrylic on canvas', image: '/media/portraits.jpg', blurb: 'Bold colour-blocked portraits of everyday Kampala faces.' },
  { id: 'a2', title: 'Beadwork Study', by: 'Artist to be announced', category: 'Mixed media', image: '/media/beadwork.jpg', blurb: 'Texture, pattern and hand-stitched detail.' },
]

export const FEATURED_DESIGNERS: ShowcaseItem[] = [
  { id: 'd1', title: 'The Crew Collection', by: 'Designer to be announced', category: 'Streetwear', image: '/media/crew.jpg', blurb: 'Everyday streetwear with Kampala attitude.' },
]

export const FEATURED_VENDORS: ShowcaseItem[] = [
  { id: 'v1', title: 'Beaded Bracelets', by: 'Vendor to be announced', category: 'Jewellery', image: '/media/bracelets.jpg', blurb: 'Hand-strung bracelets in clay, wood and glass beads.' },
  { id: 'v2', title: 'Signature Scents', by: 'Vendor to be announced', category: 'Perfume', image: '/media/perfume-set.jpg', blurb: 'Small-batch fragrances.' },
  { id: 'v3', title: 'Natural Skincare', by: 'Vendor to be announced', category: 'Skincare', image: '/media/skincare.jpg', blurb: 'Butters, oils and serums.' },
  { id: 'v4', title: 'Stone & Bead Stacks', by: 'Vendor to be announced', category: 'Accessories', image: '/media/beads.jpg', blurb: 'Stackable stone bracelets.' },
]

export const SAMPLE_POSTS = [
  { id: 'p1', author: 'Bling Fest', kind: 'Announcement', body: 'Vendor applications are open. Artists, designers and small businesses of every size are welcome. Register to sell.', image: '/media/flyer-vendors-wanted.jpg' },
  { id: 'p2', author: 'Sample vendor', kind: 'New product', body: 'Example of a vendor post: a new batch of beaded bracelets ready for the market.', image: '/media/bracelets.jpg' },
  { id: 'p3', author: 'Sample artist', kind: 'Artwork', body: 'Example of an artist post: a new portrait series heading to the exhibition wall.', image: '/media/portraits.jpg' },
]
