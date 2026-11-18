import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { NAV, SITE } from '../../config/site'
import Wordmark from './Wordmark'
import Button from '../ui/Button'

// Drawer pattern from ms-home-security-website MobileMenu: locks scroll, closes on navigation.
export default function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pathname } = useLocation()
  useEffect(() => { onClose() }, [pathname, onClose])
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="anim-fade absolute inset-0 bg-ink/60" onClick={onClose} />
      <div className="anim-slide absolute inset-y-0 right-0 flex w-[88vw] max-w-sm flex-col overflow-y-auto bg-cream">
        <div className="flex items-center justify-between border-b-2 border-ink px-5 py-3">
          <Wordmark />
          <button type="button" onClick={onClose} aria-label="Close menu" className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-cream-deep">
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 px-5 py-2" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              className={({ isActive }) => `display block border-b border-line py-3.5 text-3xl ${isActive ? 'text-purple' : 'text-ink'}`}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-3 p-5">
          <Button to="/become-a-vendor" className="w-full" size="lg">Become a Vendor</Button>
          <Button to="/sign-in" variant="outline" className="w-full">Sign In</Button>
          <p className="wide pt-2 text-center text-[10px] text-ink-soft">{SITE.dates.label} • {SITE.city}</p>
        </div>
      </div>
    </div>
  )
}
