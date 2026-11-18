import { useState } from 'react'
import { Link, NavLink, Navigate, Outlet } from 'react-router-dom'
import { CalendarDays, FileText, LayoutDashboard, Loader2, LogOut, Menu, Megaphone, Store, X } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { isConnected } from '../../lib/supabase'
import Wordmark from '../layout/Wordmark'
import Button from '../ui/Button'

const items = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/applications', label: 'Applications', icon: FileText },
  { to: '/admin/vendors', label: 'Vendors', icon: Store },
  { to: '/admin/events', label: 'Events', icon: CalendarDays },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
]

// Gate flow adapted from nova-works AdminApp: not connected -> setup; signed out -> sign-in;
// signed in but not on the admin list -> no access. The database enforces the same rules.
export default function AdminLayout() {
  const { session, isAdmin, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  if (!isConnected) return <Gate title="Connect the database"><p>Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env.local</code> (and Vercel), then run <code>supabase/schema.sql</code>. See the README.</p></Gate>
  if (session === undefined || (session && isAdmin === null)) return <div className="flex min-h-dvh items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-purple" /></div>
  if (!session) return <Navigate to="/sign-in" replace />
  if (!isAdmin) return (
    <Gate title="No access">
      <p>{session.user.email} is signed in but isn't on the Bling Fest admin list.</p>
      <Button onClick={signOut} variant="outline" className="mt-5">Sign out</Button>
    </Gate>
  )

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
          <p className="truncate text-cream/60">{session.user.email}</p>
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

function Gate({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream p-4">
      <div className="hard w-full max-w-md border-2 border-ink bg-white p-7">
        <Wordmark />
        <h1 className="display mt-4 text-4xl">{title}</h1>
        <div className="mt-3 text-sm text-ink-soft [&_code]:rounded [&_code]:bg-cream-deep [&_code]:px-1">{children}</div>
        <Link to="/" className="mt-6 block text-sm font-bold underline">Back to the site</Link>
      </div>
    </div>
  )
}
