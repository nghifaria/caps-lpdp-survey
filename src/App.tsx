import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { supabase } from './lib/supabase'
import type { Database } from './types/database'
import LoadingSpinner from './components/LoadingSpinner'
import ProtectedRoute from './components/ProtectedRoute'
import { Toaster } from 'sonner'
const LandingPage = lazy(() => import('./pages/LandingPage'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const SurveyPage = lazy(() => import('./pages/SurveyPage'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Profile = lazy(() => import('./pages/Profile'))
const FAQ = lazy(() => import('./pages/FAQ'))
const Guideline = lazy(() => import('./pages/Guideline'))

type Session = Database['public'] extends never ? never : Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']

function App() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    let active = true

    async function loadSession() {
      const { data } = await supabase.auth.getSession()

      if (active) {
        setSession(data.session)
      }
    }

    void loadSession()

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/guideline" element={<Guideline />} />
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute session={session}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute session={session} redirectTo="/login">
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/survey/:id" element={<SurveyPage />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
