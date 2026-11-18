// From ms-home-security-website (lib/format.ts + lib/forms.ts).
export const whatsappLink = (number: string, text: string) =>
  'https://wa.me/' + number.replace(/\D/g, '') + '?text=' + encodeURIComponent(text)

/** Ugandan phone numbers: 07XX XXX XXX or +256 7XX XXX XXX. */
export const isUgPhone = (v: string) =>
  /^(\+?256|0)\s*[37]\d{2}\s*\d{3}\s*\d{3}$/.test(v.replace(/[-.]/g, ' ').trim())

/** Accepts international numbers too (diaspora vendors), 9–15 digits. */
export const isPhone = (v: string) => {
  const digits = v.replace(/\D/g, '')
  return isUgPhone(v) || (digits.length >= 9 && digits.length <= 15 && /^\+?[\d\s()-]+$/.test(v.trim()))
}

export const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim())

/** Only http(s) links are stored or rendered as links. Blocks javascript: and data: URLs. */
export function safeUrl(v: string | null | undefined): string | null {
  if (!v) return null
  const raw = v.trim()
  const withScheme = /^https?:\/\//i.test(raw) ? raw : raw.startsWith('@') ? `https://instagram.com/${raw.slice(1)}` : `https://${raw}`
  try {
    const u = new URL(withScheme)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null
  } catch {
    return null
  }
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/** 0772 123 456 -> 256772123456 (WhatsApp needs the country code). */
export function toWaNumber(phone: string) {
  const d = phone.replace(/\D/g, '')
  return d.startsWith('0') ? '256' + d.slice(1) : d
}
