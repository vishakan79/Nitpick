import { useEffect } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import AppLayout from './app/AppLayout'
import Dashboard from './app/Dashboard'
import Pulls from './app/Pulls'
import PullDetail from './app/PullDetail'
import Findings from './app/Findings'
import Rules from './app/Rules'
import Settings from './app/Settings'
import AuthCallback from './pages/AuthCallback'
import { WorkspaceProvider } from './workspace'
import Illustration from './components/Illustration'
import { Button } from './components/ui'

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-5 text-center">
      <div>
        <Illustration className="mx-auto w-full max-w-[260px]" />
        <h1 className="mt-6 text-[40px] font-extrabold">Nothing to review here</h1>
        <p className="mt-2 text-soft">This page does not exist. Head back to the start.</p>
        <Button as="link" to="/" className="mt-6">
          Back to home
        </Button>
      </div>
    </div>
  )
}

function Shell({ demo }) {
  return (
    <WorkspaceProvider demo={demo}>
      <AppLayout />
    </WorkspaceProvider>
  )
}

const appRoutes = (
  <>
    <Route index element={<Dashboard />} />
    <Route path="pulls" element={<Pulls />} />
    <Route path="pulls/:id" element={<PullDetail />} />
    <Route path="findings" element={<Findings />} />
    <Route path="rules" element={<Rules />} />
    <Route path="settings" element={<Settings />} />
  </>
)

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route
          path="/"
          element={
            <WorkspaceProvider demo>
              <Landing />
            </WorkspaceProvider>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/app" element={<Shell demo={false} />}>
          {appRoutes}
        </Route>
        <Route path="/demo" element={<Shell demo />}>
          {appRoutes}
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
