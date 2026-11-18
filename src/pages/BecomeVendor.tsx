import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, ImagePlus, Loader2, X } from 'lucide-react'
import PageHero from '../components/layout/PageHero'
import Container from '../components/ui/Container'
import Button from '../components/ui/Button'
import Notice from '../components/ui/Notice'
import { Select, TextArea, TextInput } from '../components/forms/Field'
import { BUSINESS_CATEGORIES, PARTICIPATION } from '../config/site'
import { PHOTO_LIMITS, checkPhotos, fetchCaptchaSiteKey, submitApplication, validate, type ApplicationInput, type Errors } from '../lib/applications'
import Turnstile, { type TurnstileHandle } from '../components/forms/Turnstile'
import { usePageTitle } from '../lib/usePageTitle'

const EMPTY: ApplicationInput = {
  participation: '', brand_name: '', full_name: '', email: '', phone: '', location: '',
  business_category: '', description: '', social_link: '', additional_info: '', consent: false,
}

const blurbs: Record<string, string> = {
  art_exhibition: 'Painters, illustrators, photographers, mixed media.',
  fashion_runway: 'Designers applying to show a collection on the runway.',
  creative_market: 'A stall at the market for any creative business.',
  jewellery_accessories: 'Beads, metalwork, bags and accessories.',
  beauty_makeup: 'Makeup artists, skincare, perfume, hair & wigs.',
  other_sme: 'Food, gifts, online shops and every other SME.',
}

export default function BecomeVendor() {
  usePageTitle('Become a Vendor')
  const [params] = useSearchParams()
  const [v, setV] = useState<ApplicationInput>(() => {
    const c = params.get('category')
    return { ...EMPTY, participation: PARTICIPATION.some((p) => p.value === c) ? (c as string) : '' }
  })
  const [photos, setPhotos] = useState<File[]>([])
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [serverError, setServerError] = useState('')
  const [done, setDone] = useState<string | null>(null)
  const [siteKey, setSiteKey] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState('')
  const captchaRef = useRef<TurnstileHandle>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  useEffect(() => { fetchCaptchaSiteKey().then(setSiteKey) }, [])
  const topRef = useRef<HTMLDivElement>(null)

  const previews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos])
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews])

  const set = <K extends keyof ApplicationInput>(k: K, value: ApplicationInput[K]) => {
    setV((s) => ({ ...s, [k]: value }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const addPhotos = (list: FileList | null) => {
    if (!list) return
    const next = [...photos, ...Array.from(list)].slice(0, PHOTO_LIMITS.max)
    const err = checkPhotos(next)
    setErrors((e) => ({ ...e, photos: err ?? undefined }))
    if (!err) setPhotos(next)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError('')
    const errs = validate(v, photos)
    if (siteKey && !captchaToken) errs.captcha = 'Please tick the "I\'m human" check.'
    setErrors(errs)
    const first = Object.keys(errs).filter((k) => k !== 'captcha')[0] ?? (errs.captcha ? 'captcha' : undefined)
    if (first) {
      document.getElementById(first)?.focus()
      return
    }
    setBusy(true)
    setProgress(photos.length ? 'Uploading photos…' : 'Sending…')
    const res = await submitApplication(v, photos, captchaToken)
    setBusy(false)
    setProgress('')
    if (res.ok) {
      setDone(res.reference)
      topRef.current?.scrollIntoView({ behavior: 'smooth' })
    } else {
      setServerError(res.error)
      captchaRef.current?.reset() // tokens are single-use
      if (res.field) setErrors((e) => ({ ...e, [res.field as keyof Errors]: res.error }))
    }
  }

  if (done) {
    return (
      <>
        <div ref={topRef} />
        <PageHero kicker="Application received" title="You're in the queue" tone="purple" />
        <Container className="py-14">
          <div className="hard mx-auto max-w-xl border-2 border-ink bg-white p-6 text-center sm:p-8">
            <CheckCircle2 className="mx-auto h-14 w-14 text-ok" />
            <p className="display mt-4 text-4xl">Thank you, {v.full_name.split(' ')[0]}!</p>
            <p className="mt-3 text-ink-soft">Your application for <strong className="text-ink">{v.brand_name}</strong> has been received. The Bling Fest team reviews every application and will contact you on {v.email} or WhatsApp.</p>
            <p className="wide mt-6 text-xs text-ink-soft">Your reference</p>
            <p className="display mt-1 text-5xl tracking-wider text-purple">{done}</p>
            <p className="mt-6 text-sm text-ink-soft">Participation fees and packages will be shared once confirmed by the organisers.</p>
            <Button to="/" variant="ink" className="mt-7">Back to home</Button>
          </div>
        </Container>
      </>
    )
  }

  return (
    <>
      <div ref={topRef} />
      <PageHero kicker="Vendors wanted" title="Register to sell" tone="orange"
        intro="Artists, designers, beauty brands, food vendors and small businesses of every size. Takes about 5 minutes. Applications are reviewed before approval." />

      <Container className="py-10 sm:py-14">
        <form onSubmit={onSubmit} noValidate className="mx-auto max-w-3xl space-y-10">

          {/* 1. Participation */}
          <fieldset>
            <legend className="display mb-2 text-4xl leading-[0.95]"><span className="text-orange">1.</span> How will you take part?</legend>
            <p className="mb-4 text-sm text-ink-soft">Choose one. You can mention others under additional information.</p>
            <div id="participation" tabIndex={-1} role="radiogroup" aria-invalid={!!errors.participation} className="grid gap-3 sm:grid-cols-2">
              {PARTICIPATION.map((p) => {
                const on = v.participation === p.value
                return (
                  <label key={p.value} className={`hard-sm flex cursor-pointer gap-3 border-2 border-ink p-4 transition ${on ? 'bg-purple text-cream' : 'bg-white hover:bg-cream-deep'}`}>
                    <input type="radio" name="participation" value={p.value} checked={on} onChange={() => set('participation', p.value)} className="mt-1 h-4 w-4 accent-orange" />
                    <span>
                      <span className="display block text-2xl">{p.label}</span>
                      <span className={`text-sm ${on ? 'text-cream/80' : 'text-ink-soft'}`}>{blurbs[p.value]}</span>
                    </span>
                  </label>
                )
              })}
            </div>
            {errors.participation && <p className="mt-2 text-xs font-semibold text-bad">{errors.participation}</p>}
          </fieldset>

          {/* 2. You */}
          <fieldset className="grid gap-5 sm:grid-cols-2">
            <legend className="display mb-4 text-4xl leading-[0.95] sm:col-span-2"><span className="text-orange">2.</span> About you</legend>
            <TextInput label="Full name" name="full_name" required autoComplete="name" maxLength={120} value={v.full_name} onChange={(e) => set('full_name', e.target.value)} error={errors.full_name} />
            <TextInput label="Email address" name="email" type="email" required autoComplete="email" maxLength={200} value={v.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
            <TextInput label="Phone / WhatsApp" name="phone" type="tel" required autoComplete="tel" inputMode="tel" maxLength={20} placeholder="0772 123 456" value={v.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} />
            <TextInput label="Business location" name="location" required maxLength={160} placeholder="e.g. Ntinda, Kampala" value={v.location} onChange={(e) => set('location', e.target.value)} error={errors.location} />
          </fieldset>

          {/* 3. Business */}
          <fieldset className="grid gap-5 sm:grid-cols-2">
            <legend className="display mb-4 text-4xl leading-[0.95] sm:col-span-2"><span className="text-orange">3.</span> Your business</legend>
            <TextInput label="Business or brand name" name="brand_name" required maxLength={120} value={v.brand_name} onChange={(e) => set('brand_name', e.target.value)} error={errors.brand_name} />
            <Select label="Business category" name="business_category" required options={BUSINESS_CATEGORIES} placeholder="Choose a category" value={v.business_category} onChange={(e) => set('business_category', e.target.value)} error={errors.business_category} />
            <div className="sm:col-span-2">
              <TextArea label="Short business description" name="description" required maxLength={1500} rows={4}
                placeholder="What do you make or sell? What makes it special?" value={v.description} onChange={(e) => set('description', e.target.value)}
                error={errors.description} hint={`${v.description.trim().length}/1500 — at least 20 characters`} />
            </div>
            <div className="sm:col-span-2">
              <TextInput label="Instagram or social media link" name="social_link" maxLength={300} placeholder="@yourbrand or https://…" value={v.social_link} onChange={(e) => set('social_link', e.target.value)} error={errors.social_link} />
            </div>
          </fieldset>

          {/* 4. Photos */}
          <fieldset>
            <legend className="display mb-2 text-4xl leading-[0.95]"><span className="text-orange">4.</span> Product or portfolio photos</legend>
            <p className="mb-4 text-sm text-ink-soft">Up to {PHOTO_LIMITS.max} photos. JPG, PNG or WebP, 5 MB each. Clear, well-lit photos help your application.</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {previews.map((src, i) => (
                <div key={src} className="relative aspect-square border-2 border-ink bg-white">
                  <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))} aria-label={`Remove photo ${i + 1}`}
                    className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-cream"><X className="h-4 w-4" /></button>
                </div>
              ))}
              {photos.length < PHOTO_LIMITS.max && (
                <button type="button" id="photos" onClick={() => fileRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-1 border-2 border-dashed border-ink bg-white text-xs font-bold hover:bg-cream-deep">
                  <ImagePlus className="h-6 w-6 text-purple" /> Add photos
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept={PHOTO_LIMITS.types.join(',')} multiple className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => addPhotos(e.target.files)} />
            {errors.photos && <p className="mt-2 text-xs font-semibold text-bad">{errors.photos}</p>}
          </fieldset>

          {/* 5. Extra */}
          <fieldset className="space-y-5">
            <legend className="display mb-4 text-4xl leading-[0.95]"><span className="text-orange">5.</span> Anything else?</legend>
            <TextArea label="Additional information" name="additional_info" maxLength={1500} rows={3}
              placeholder="Space needs, runway look count, power needs, questions…" value={v.additional_info} onChange={(e) => set('additional_info', e.target.value)} error={errors.additional_info} />
            <label className="flex items-start gap-3 text-sm">
              <input id="consent" type="checkbox" checked={v.consent} onChange={(e) => set('consent', e.target.checked)} className="mt-0.5 h-5 w-5 accent-purple" />
              <span>I agree that Bling Fest may store these details and contact me by email, phone or WhatsApp about my application.</span>
            </label>
            {errors.consent && <p className="text-xs font-semibold text-bad">{errors.consent}</p>}
          </fieldset>

          {siteKey && (
            <div id="captcha" tabIndex={-1}>
              <Turnstile ref={captchaRef} siteKey={siteKey}
                onToken={(t) => { setCaptchaToken(t); if (t) setErrors((e) => ({ ...e, captcha: undefined })) }}
                onError={() => setErrors((e) => ({ ...e, captcha: "The \"I'm human\" check didn't load. Refresh the page and try again." }))} />
              {errors.captcha && <p className="mt-1 text-xs font-semibold text-bad">{errors.captcha}</p>}
            </div>
          )}

          {serverError && <Notice tone="bad">{serverError}</Notice>}
          {Object.values(errors).some(Boolean) && !serverError && <Notice tone="bad">Please fix the highlighted fields.</Notice>}

          <div className="flex flex-col items-start gap-3 border-t-2 border-ink pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-ink-soft">Participation fees and packages will be announced by the organisers. <Link to="/events" className="underline">Event info</Link></p>
            <Button type="submit" size="lg" disabled={busy} className="w-full sm:w-auto">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> {progress || 'Sending…'}</> : 'Submit application'}
            </Button>
          </div>
        </form>
      </Container>
    </>
  )
}
