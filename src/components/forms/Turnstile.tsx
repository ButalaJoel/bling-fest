import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

// Cloudflare Turnstile widget. Renders nothing when the CAPTCHA is switched off on the server.
type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string
  reset: (id: string) => void
  remove: (id: string) => void
}
declare global { interface Window { turnstile?: TurnstileApi } }

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let loading: Promise<void> | null = null
function loadScript() {
  if (window.turnstile) return Promise.resolve()
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SCRIPT
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => { loading = null; reject(new Error('captcha script failed')) }
    document.head.appendChild(s)
  })
  return loading
}

export type TurnstileHandle = { reset: () => void }

type Props = { siteKey: string; onToken: (token: string) => void; onError: () => void }

const Turnstile = forwardRef<TurnstileHandle, Props>(function Turnstile({ siteKey, onToken, onError }, ref) {
  const box = useRef<HTMLDivElement>(null)
  const id = useRef<string | null>(null)
  const cb = useRef({ onToken, onError })
  useEffect(() => { cb.current = { onToken, onError } }, [onToken, onError])

  useImperativeHandle(ref, () => ({
    reset: () => {
      cb.current.onToken('')
      if (id.current && window.turnstile) window.turnstile.reset(id.current)
    },
  }), [])

  useEffect(() => {
    let live = true
    loadScript().then(() => {
      if (!live || !box.current || !window.turnstile) return
      id.current = window.turnstile.render(box.current, {
        sitekey: siteKey,
        action: 'apply',
        theme: 'light',
        callback: (t: string) => cb.current.onToken(t),
        'expired-callback': () => cb.current.onToken(''),
        'error-callback': () => { cb.current.onToken(''); cb.current.onError() },
      })
    }).catch(() => cb.current.onError())
    return () => {
      live = false
      if (id.current && window.turnstile) window.turnstile.remove(id.current)
      id.current = null
    }
  }, [siteKey])

  return <div ref={box} className="min-h-[65px]" />
})

export default Turnstile
