import { api } from './api'
import type { AppStatus } from '../config/site'

// Admin API. The server checks the session and role on every call.

export type Application = {
  id: string; reference: string; brand_name: string; full_name: string; email: string; phone: string
  location: string; business_category: string; description: string; social_link: string | null
  participation: string; additional_info: string | null; status: AppStatus
  reviewed_by: string | null; reviewed_at: string | null; created_at: string
  photos: string[]; notes: Note[]
}
export type Note = { id: string; author_email: string | null; body: string; created_at: string }
export type Stats = { total: number; by_status: Record<string, number>; by_participation: Record<string, number> }
export type ApplicationRow = Pick<Application, 'id' | 'reference' | 'brand_name' | 'full_name' | 'email' | 'phone' | 'participation' | 'business_category' | 'status' | 'created_at'>

export const fetchStats = () => api<Stats>('/admin/stats')

export function listApplications(opts: { q?: string; status?: string; participation?: string; page?: number }) {
  const p = new URLSearchParams()
  if (opts.q) p.set('q', opts.q)
  if (opts.status) p.set('status', opts.status)
  if (opts.participation) p.set('participation', opts.participation)
  if (opts.page) p.set('page', String(opts.page))
  return api<{ rows: ApplicationRow[]; count: number; pageSize: number }>(`/admin/applications?${p}`)
}

export const getApplication = (id: string) => api<Application>(`/admin/applications/${encodeURIComponent(id)}`)

export const setStatus = (id: string, status: AppStatus) =>
  api<{ status: AppStatus; vendorCreated: boolean }>(`/admin/applications/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } })

export const addNote = (id: string, body: string) =>
  api(`/admin/applications/${encodeURIComponent(id)}/notes`, { method: 'POST', body: { body: body.trim().slice(0, 2000) } })

// Vendors -------------------------------------------------------------------
export type VendorRow = { id: string; slug: string; name: string; participation: string; category: string; location: string | null; whatsapp: string | null; contact_email: string | null; is_active: boolean; is_featured: boolean; created_at: string }

export const listVendors = () => api<VendorRow[]>('/admin/vendors')
export const updateVendor = (id: string, patch: Partial<Pick<VendorRow, 'is_active' | 'is_featured'>>) =>
  api(`/admin/vendors/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch })

// Events & announcements ----------------------------------------------------
export type AdminEvent = { id: string; slug: string; title: string; theme: string | null; starts_on: string; ends_on: string; city: string; venue: string | null; summary: string | null; is_published: boolean }
export type AdminAnnouncement = { id: string; title: string; body: string; is_published: boolean; published_at: string }

export const listEvents = () => api<AdminEvent[]>('/admin/events')
export function saveEvent(e: Omit<AdminEvent, 'id' | 'slug'> & { id?: string; slug?: string }) {
  const body = { title: e.title, theme: e.theme, starts_on: e.starts_on, ends_on: e.ends_on, city: e.city, venue: e.venue, summary: e.summary, is_published: e.is_published }
  return e.id ? api(`/admin/events/${encodeURIComponent(e.id)}`, { method: 'PATCH', body }) : api('/admin/events', { method: 'POST', body })
}

export const listAnnouncements = () => api<AdminAnnouncement[]>('/admin/announcements')
export function saveAnnouncement(a: { id?: string; title: string; body: string; is_published: boolean }) {
  const body = { title: a.title, body: a.body, is_published: a.is_published }
  return a.id ? api(`/admin/announcements/${encodeURIComponent(a.id)}`, { method: 'PATCH', body }) : api('/admin/announcements', { method: 'POST', body })
}
export const deleteAnnouncement = (id: string) => api(`/admin/announcements/${encodeURIComponent(id)}`, { method: 'DELETE' })

export const changePassword = (current: string, next: string) => api('/auth/password', { method: 'POST', body: { current, next } })
