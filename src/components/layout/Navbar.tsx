import { useCallback, useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { NAV, SITE } from '../../config/site'
import Container from '../ui/Container'
import Button from '../ui/Button'
import Wordmark from './Wordmark'
import MobileMenu from './MobileMenu'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <div className="bg-ink text-cream">
        <Container className="flex h-9 items-center justify-between gap-4 text-[10px] sm:text-[11px]">
          <p className="wide truncate">{SITE.theme} • {SITE.dates.label} • {SITE.city}</p>
          <p className="wide hidden text-orange sm:block">Vendors wanted — register to sell</p>
        </Container>
      </div>
      <header className={`sticky top-0 z-40 border-b-2 border-ink bg-cream/95 backdrop-blur transition-shadow ${scrolled ? 'shadow-[0_4px_0_0_rgba(25,22,34,0.12)]' : ''}`}>
        <Container className="flex h-16 items-center justify-between gap-4">
          <Wordmark />
          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
            {NAV.slice(1).map((n) => (
              <NavLink key={n.to} to={n.to}
                className={({ isActive }) => `rounded-full px-3 py-2 text-[13px] font-bold transition xl:px-3.5 ${isActive ? 'bg-purple text-cream' : 'text-ink hover:bg-cream-deep'}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <NavLink to="/sign-in" className="hidden rounded-full px-3 py-2 text-[13px] font-bold text-ink hover:bg-cream-deep lg:inline-flex">Sign In</NavLink>
            <Button to="/become-a-vendor" size="sm" className="hidden sm:inline-flex">Become a Vendor</Button>
            <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </Container>
      </header>
      <MobileMenu open={open} onClose={close} />
    </>
  )
}
