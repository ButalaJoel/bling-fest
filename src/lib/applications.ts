import { api, type ApiError } from './api'
import { isEmail, isPhone, safeUrl } from './format'
import { PARTICIPATION, BUSINESS_CATEGORIES } from '../config/site'

export const PHOTO_LIMITS = { max: 6, bytes: 5 * 1024 * 1024, types: ['image/jpeg', 'image/png', 'image/webp'] as const }

export type ApplicationInput = {
  participation: string
  brand_name: string
  full_name: string
  email: string
  phone: string
  location: string
  business_category: string
  description: string
  social_link: string
  additional_info: string
  consent: boolean
}

export type Errors = Partial<Record<keyof ApplicationInput | 'photos', string>>

// Same rules as the database constraints, so people see problems before submitting.
// The database re-checks everything: this is for usability, not security.
export function validate(v: ApplicationInput, photos: File[]): Errors {
  const e: Errors = {}
  const len = (s: string) => s.trim().length
  if (!PARTICIPATION.some((p) => p.value === v.participation)) e.participation = 'Choose how you want to take part.'
  if (len(v.brand_name) < 2 || len(v.brand_name) > 120) e.brand_name = 'Enter your business or brand name.'
  if (len(v.full_name) < 2 || len(v.full_name) > 120) e.full_name = 'Enter your full name.'
  if (!isEmail(v.email) || len(v.email) > 200) e.email = 'Enter a valid email address.'
  if (!isPhone(v.phone)) e.phone = 'Enter a valid phone / WhatsApp number, e.g. 0772 123 456.'
  if (len(v.location) < 2 || len(v.location) > 160) e.location = 'Where is your business based?'
  if (!(BUSINESS_CATEGORIES as readonly string[]).includes(v.business_category)) e.business_category = 'Choose a business category.'
  if (len(v.description) < 20) e.description = 'Tell us a little more (at least 20 characters).'
  if (len(v.description) > 1500) e.description = 'Keep it under 1,500 characters.'
  if (v.social_link.trim() && !safeUrl(v.social_link)) e.social_link = 'Enter a valid link or @handle.'
  if (len(v.additional_info) > 1500) e.additional_info = 'Keep it under 1,500 characters.'
  if (!v.consent) e.consent = 'Please confirm so we can contact you.'
  const photoError = checkPhotos(photos)
  if (photoError) e.photos = photoError
  return e
}

export function checkPhotos(files: File[]): string | null {
  if (files.length > PHOTO_LIMITS.max) return `Up to ${PHOTO_LIMITS.max} photos.`
  for (const f of files) {
    if (!(PHOTO_LIMITS.types as readonly string[]).includes(f.type)) return `${f.name}: use JPG, PNG or WebP.`
    if (f.size > PHOTO_LIMITS.bytes) return `${f.name} is over 5 MB.`
  }
  return null
}

export type SubmitResult = { ok: true; reference: string } | { ok: false; error: string; field?: string }

export async function submitApplication(v: ApplicationInput, photos: File[]): Promise<SubmitResult> {
  const form = new FormData()
  form.set('participation', v.participation)
  form.set('brand_name', v.brand_name.trim())
  form.set('full_name', v.full_name.trim())
  form.set('email', v.email.trim().toLowerCase())
  form.set('phone', v.phone.trim())
  form.set('location', v.location.trim())
  form.set('business_category', v.business_category)
  form.set('description', v.description.trim())
  form.set('social_link', v.social_link.trim())
  form.set('additional_info', v.additional_info.trim())
  form.set('consent', String(v.consent))
  for (const p of photos) form.append('photos', p)
  try {
    const r = await api<{ reference: string }>('/applications', { method: 'POST', form })
    return { ok: true, reference: r.reference }
  } catch (e) {
    const err = e as ApiError
    return { ok: false, error: err.message, field: err.field }
  }
}
