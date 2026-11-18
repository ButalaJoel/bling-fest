import { useState } from 'react'
import { Link, NavLink, Navigate, Outlet } from 'react-router-dom'
import { CalendarDays, FileText, KeyRound, LayoutDashboard, Loader2, LogOut, Menu, Megaphone, Store, X } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import Wordmark from '../layout/Wordmark'

const items = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/applications', label: 'Applications', icon: FileText },
  { to: '/admin/vendors', label: 'Vendors', icon: Store },
  { to: '/admin/events', label: 'Events', icon: CalendarDays },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/admin/account', label: 'Account', icon: KeyRound },
]

// Gate flow adapted from nova-works AdminApp. The server enforces the same rules on every request.
export default function AdminLayout() {
  const { admin, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  if (admin === undefined) return <div className="flex min-h-dvh items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-purple" /></div>
  if (!admin) return <Navigate to="/sign-in" replace />

  return (
    <div className="min-h-dvh bg-cream lg:grid lg:grid-cols-[240px_1fr]">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r-2 border-ink bg-ink text-cream transition-transform lg:static lg:w-auto lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between px-5">
          <Wordmark light />
          <button onClick={() => setOpen(false)} className="lg:hidden" aria-label="Close menu"><X className="h-6 w-6" /></button>
        </div>
        <p className="wide px-5 text-[10px] text-orange">Admin dashboard</p>
        <nav className="mt-4 space-y-1 px-3" aria-label="Admin">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded px-3 py-2.5 text-sm font-bold ${isActive ? 'bg-purple text-cream' : 'text-cream/80 hover:bg-cream/10'}`}>
              <i.icon className="h-4 w-4" />{i.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute inset-x-0 bottom-0 space-y-2 border-t border-cream/10 p-4 text-xs">
          <p className="truncate text-cream/60">{admin.email}</p>
          <p className="wide text-[9px] text-orange">{admin.role}</p>
          <div className="flex gap-3">
            <Link to="/" className="font-bold hover:text-orange">View site</Link>
            <button onClick={signOut} className="inline-flex items-center gap-1 font-bold hover:text-orange"><LogOut className="h-3.5 w-3.5" />Sign out</button>
          </div>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-ink/50 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b-2 border-ink bg-cream px-4 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open admin menu"><Menu className="h-6 w-6" /></button>
          <span className="wide text-xs">Admin</span>
        </header>
        <main className="p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  )
}
