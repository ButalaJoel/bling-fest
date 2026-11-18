import { db, isConnected } from './supabase'
import { isEmail, isPhone, safeUrl } from './format'
import { PARTICIPATION, BUSINESS_CATEGORIES } from '../config/site'

export const PHOTO_LIMITS = { max: 6, bytes: 5 * 1024 * 1024, types: ['image/jpeg', 'image/png', 'image/webp'] as const }
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

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

const rand = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => (b % 36).toString(36)).join('') + Date.now().toString(36).slice(-4)
export const referenceFor = (id: string) => id.replace(/-/g, '').slice(0, 8).toUpperCase()

export type SubmitResult = { ok: true; reference: string } | { ok: false; error: string }

export async function submitApplication(v: ApplicationInput, photos: File[], onProgress?: (msg: string) => void): Promise<SubmitResult> {
  if (!isConnected) return { ok: false, error: 'Applications open as soon as the site is connected. Please check back shortly.' }
  const supabase = db()
  const id = crypto.randomUUID()
  const paths: string[] = []

  try {
    for (const [i, file] of photos.entries()) {
      onProgress?.(`Uploading photo ${i + 1} of ${photos.length}…`)
      const path = `submissions/${id}/${i}-${rand()}.${EXT[file.type]}`
      const { error } = await supabase.storage.from('applications').upload(path, file, { contentType: file.type, upsert: false, cacheControl: '3600' })
      if (error) return { ok: false, error: 'A photo failed to upload. Check your connection and try again.' }
      paths.push(path)
    }

    onProgress?.('Sending your application…')
    const { error } = await supabase.from('applications').insert({
      id,
      participation: v.participation,
      brand_name: v.brand_name.trim(),
      full_name: v.full_name.trim(),
      email: v.email.trim().toLowerCase(),
      phone: v.phone.trim(),
      location: v.location.trim(),
      business_category: v.business_category,
      description: v.description.trim(),
      social_link: safeUrl(v.social_link),
      additional_info: v.additional_info.trim() || null,
      photo_paths: paths,
      consent: v.consent,
    })
    if (error) {
      // Rate-limit and validation messages from the database are written for applicants.
      if (error.code === 'P0001') return { ok: false, error: error.message }
      return { ok: false, error: 'We could not send your application. Please check the form and try again.' }
    }
    return { ok: true, reference: referenceFor(id) }
  } catch {
    return { ok: false, error: 'No connection. Please check your internet and try again.' }
  }
}
