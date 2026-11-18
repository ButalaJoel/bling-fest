import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import SiteLayout from './components/layout/SiteLayout'
import Home from './pages/Home'
import Explore from './pages/Explore'
import ArtExhibition from './pages/ArtExhibition'
import FashionRunway from './pages/FashionRunway'
import Marketplace from './pages/Marketplace'
import Storefront from './pages/Storefront'
import Community from './pages/Community'
import Events from './pages/Events'
import BecomeVendor from './pages/BecomeVendor'
import SignIn from './pages/SignIn'
import NotFound from './pages/NotFound'

// Admin code is split into its own chunk: public visitors never download it.
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const Overview = lazy(() => import('./pages/admin/Overview'))
const Applications = lazy(() => import('./pages/admin/Applications'))
const ApplicationDetail = lazy(() => import('./pages/admin/ApplicationDetail'))
const Vendors = lazy(() => import('./pages/admin/Vendors'))
const AdminEvents = lazy(() => import('./pages/admin/Events'))
const Announcements = lazy(() => import('./pages/admin/Announcements'))
const Account = lazy(() => import('./pages/admin/Account'))

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="p-10 text-center">Loading…</div>}>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route index element={<Home />} />
              <Route path="explore" element={<Explore />} />
              <Route path="art" element={<ArtExhibition />} />
              <Route path="runway" element={<FashionRunway />} />
              <Route path="marketplace" element={<Marketplace />} />
              <Route path="marketplace/:slug" element={<Storefront />} />
              <Route path="community" element={<Community />} />
              <Route path="events" element={<Events />} />
              <Route path="become-a-vendor" element={<BecomeVendor />} />
              <Route path="sign-in" element={<SignIn />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<Overview />} />
              <Route path="applications" element={<Applications />} />
              <Route path="applications/:id" element={<ApplicationDetail />} />
              <Route path="vendors" element={<Vendors />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="account" element={<Account />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
