import { supabase } from './supabase'
import { SITE } from '../config/site'

// Public reads. Only columns granted to the anon role are requested (never select('*') on vendors).
export type PublicVendor = {
  id: string; slug: string; name: string; participation: string; category: string
  location: string | null; bio: string | null; whatsapp: string | null; social_link: string | null; is_featured: boolean
}
const VENDOR_COLS = 'id, slug, name, participation, category, location, bio, whatsapp, social_link, is_featured'

export type EventRow = { id: string; slug: string; title: string; theme: string | null; starts_on: string; ends_on: string; city: string; venue: string | null; summary: string | null }
export type Announcement = { id: string; title: string; body: string; published_at: string }

export const FALLBACK_EVENT: EventRow = {
  id: 'fallback', slug: 'bling-fest-2026', title: SITE.name, theme: `${SITE.theme}: ${SITE.pillars}`,
  starts_on: SITE.dates.start, ends_on: SITE.dates.end, city: SITE.city, venue: SITE.venue,
  summary: 'Two days of art, runway and an open creative market for independent businesses of every size.',
}

export async function fetchVendors(): Promise<PublicVendor[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('vendors').select(VENDOR_COLS).eq('is_active', true).order('is_featured', { ascending: false }).order('name')
  return error ? [] : (data as PublicVendor[])
}

export async function fetchVendor(slug: string): Promise<PublicVendor | null> {
  if (!supabase) return null
  const { data } = await supabase.from('vendors').select(VENDOR_COLS).eq('slug', slug).eq('is_active', true).maybeSingle()
  return (data as PublicVendor) ?? null
}

export async function fetchEvents(): Promise<EventRow[]> {
  if (!supabase) return [FALLBACK_EVENT]
  const { data, error } = await supabase.from('events').select('id, slug, title, theme, starts_on, ends_on, city, venue, summary').eq('is_published', true).order('starts_on')
  return error || !data?.length ? [FALLBACK_EVENT] : (data as EventRow[])
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('announcements').select('id, title, body, published_at').eq('is_published', true).order('published_at', { ascending: false }).limit(20)
  return error ? [] : (data as Announcement[])
}

export function formatRange(a: string, b: string) {
  const s = new Date(a + 'T00:00:00'), e = new Date(b + 'T00:00:00')
  const m = (d: Date) => d.toLocaleDateString('en-GB', { month: 'long' })
  if (a === b) return `${s.getDate()} ${m(s)} ${s.getFullYear()}`
  if (s.getMonth() === e.getMonth()) return `${s.getDate()}–${e.getDate()} ${m(e)} ${e.getFullYear()}`
  return `${s.getDate()} ${m(s)} – ${e.getDate()} ${m(e)} ${e.getFullYear()}`
}
