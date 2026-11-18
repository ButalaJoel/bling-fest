import { db } from './supabase'
import type { AppStatus } from '../config/site'

// Every call here is enforced by Row Level Security: a non-admin gets nothing back.

export type Application = {
  id: string; reference: string; brand_name: string; full_name: string; email: string; phone: string
  location: string; business_category: string; description: string; social_link: string | null
  participation: string; additional_info: string | null; photo_paths: string[]; status: AppStatus
  reviewed_by: string | null; reviewed_at: string | null; created_at: string
}
export type Note = { id: string; author_email: string | null; body: string; created_at: string }
export type Stats = { total: number; by_status: Record<string, number>; by_participation: Record<string, number> }

const PAGE = 25

export async function fetchStats(): Promise<Stats> {
  const { data, error } = await db().rpc('application_stats')
  if (error) throw error
  return data as Stats
}

export async function listApplications(opts: { q?: string; status?: string; participation?: string; page?: number }) {
  const page = opts.page ?? 0
  let query = db().from('applications')
    .select('id, reference, brand_name, full_name, email, phone, participation, business_category, status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * PAGE, page * PAGE + PAGE - 1)
  if (opts.status) query = query.eq('status', opts.status)
  if (opts.participation) query = query.eq('participation', opts.participation)
  const q = opts.q?.trim().replace(/[%,()*\\]/g, ' ').slice(0, 80) // keep the filter expression safe
  if (q) query = query.or(`brand_name.ilike.%${q}%,full_name.ilike.%${q}%,email.ilike.%${q}%,reference.ilike.%${q}%,phone.ilike.%${q}%`)
  const { data, error, count } = await query
  if (error) throw error
  return { rows: data as Pick<Application, 'id' | 'reference' | 'brand_name' | 'full_name' | 'email' | 'phone' | 'participation' | 'business_category' | 'status' | 'created_at'>[], count: count ?? 0, pageSize: PAGE }
}

export async function getApplication(id: string): Promise<Application | null> {
  const { data, error } = await db().from('applications').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as Application | null
}

export async function setStatus(id: string, status: AppStatus) {
  const { error, data } = await db().from('applications').update({ status }).eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('NOT_ALLOWED')
}

export async function listNotes(id: string): Promise<Note[]> {
  const { data, error } = await db().from('application_notes').select('id, author_email, body, created_at').eq('application_id', id).order('created_at')
  if (error) throw error
  return data as Note[]
}

export async function addNote(application_id: string, body: string) {
  const { error } = await db().from('application_notes').insert({ application_id, body: body.trim().slice(0, 2000) })
  if (error) throw error
}

/** Photos live in a private bucket; admins get short-lived signed links (10 minutes). */
export async function signedPhotos(paths: string[]): Promise<string[]> {
  if (!paths.length) return []
  const { data, error } = await db().storage.from('applications').createSignedUrls(paths, 600)
  if (error) throw error
  return data.map((d) => d.signedUrl).filter(Boolean) as string[]
}

// Vendors -------------------------------------------------------------------
export type VendorRow = { id: string; slug: string; name: string; participation: string; category: string; location: string | null; whatsapp: string | null; contact_email: string | null; is_active: boolean; is_featured: boolean; created_at: string }

export async function listVendors(): Promise<VendorRow[]> {
  const { data, error } = await db().from('vendors').select('id, slug, name, participation, category, location, whatsapp, contact_email, is_active, is_featured, created_at').order('created_at', { ascending: false })
  if (error) throw error
  return data as VendorRow[]
}

export async function updateVendor(id: string, patch: Partial<Pick<VendorRow, 'is_active' | 'is_featured'>>) {
  const { error, data } = await db().from('vendors').update(patch).eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('NOT_ALLOWED')
}

// Events & announcements ----------------------------------------------------
export type AdminEvent = { id: string; slug: string; title: string; theme: string | null; starts_on: string; ends_on: string; city: string; venue: string | null; summary: string | null; is_published: boolean }
export type AdminAnnouncement = { id: string; title: string; body: string; is_published: boolean; published_at: string }

export async function listEvents(): Promise<AdminEvent[]> {
  const { data, error } = await db().from('events').select('id, slug, title, theme, starts_on, ends_on, city, venue, summary, is_published').order('starts_on')
  if (error) throw error
  return data as AdminEvent[]
}

export async function saveEvent(e: Omit<AdminEvent, 'id'> & { id?: string }) {
  const row = { ...e, venue: e.venue?.trim() || null, theme: e.theme?.trim() || null, summary: e.summary?.trim() || null }
  const { error } = e.id ? await db().from('events').update(row).eq('id', e.id) : await db().from('events').insert(row)
  if (error) throw error
}

export async function listAnnouncements(): Promise<AdminAnnouncement[]> {
  const { data, error } = await db().from('announcements').select('id, title, body, is_published, published_at').order('published_at', { ascending: false })
  if (error) throw error
  return data as AdminAnnouncement[]
}

export async function saveAnnouncement(a: { id?: string; title: string; body: string; is_published: boolean }) {
  const row = { title: a.title.trim(), body: a.body.trim(), is_published: a.is_published }
  const { error } = a.id ? await db().from('announcements').update(row).eq('id', a.id) : await db().from('announcements').insert(row)
  if (error) throw error
}

export async function deleteAnnouncement(id: string) {
  const { error } = await db().from('announcements').delete().eq('id', id)
  if (error) throw error
}
