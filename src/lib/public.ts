import { api } from './api'
import { SITE } from '../config/site'

// Public reads. The server only ever returns public columns.
export type PublicVendor = {
  id: string; slug: string; name: string; participation: string; category: string
  location: string | null; bio: string | null; whatsapp: string | null; social_link: string | null; is_featured: boolean
}

export type EventRow = { id: string; slug: string; title: string; theme: string | null; starts_on: string; ends_on: string; city: string; venue: string | null; summary: string | null }
export type Announcement = { id: string; title: string; body: string; published_at: string }

export const FALLBACK_EVENT: EventRow = {
  id: 'fallback', slug: 'bling-fest-2026', title: SITE.name, theme: `${SITE.theme}: ${SITE.pillars}`,
  starts_on: SITE.dates.start, ends_on: SITE.dates.end, city: SITE.city, venue: SITE.venue,
  summary: 'Two days of art, runway and an open creative market for independent businesses of every size.',
}

export async function fetchVendors(): Promise<PublicVendor[]> {
  return api<PublicVendor[]>('/vendors').catch(() => [])
}

export async function fetchVendor(slug: string): Promise<PublicVendor | null> {
  return api<PublicVendor>(`/vendors/${encodeURIComponent(slug)}`).catch(() => null)
}

export async function fetchEvents(): Promise<EventRow[]> {
  const rows = await api<EventRow[]>('/events').catch(() => [])
  return rows.length ? rows : [FALLBACK_EVENT]
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  return api<Announcement[]>('/announcements').catch(() => [])
}

export function formatRange(a: string, b: string) {
  const s = new Date(a + 'T00:00:00'), e = new Date(b + 'T00:00:00')
  const m = (d: Date) => d.toLocaleDateString('en-GB', { month: 'long' })
  if (a === b) return `${s.getDate()} ${m(s)} ${s.getFullYear()}`
  if (s.getMonth() === e.getMonth()) return `${s.getDate()}–${e.getDate()} ${m(e)} ${e.getFullYear()}`
  return `${s.getDate()} ${m(s)} – ${e.getDate()} ${m(e)} ${e.getFullYear()}`
}
