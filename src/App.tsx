import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { supabase } from './lib/supabase'
import type { Database } from './types/database'
import LoadingSpinner from './components/LoadingSpinner'
import ProtectedRoute from './components/ProtectedRoute'
import { Toaster } from 'sonner'

// Layouts
import RespLayout from './components/layout/RespLayout'
import AdminLayout from './components/layout/AdminLayout'

// Pages (Lazy loaded)
const HomePage = lazy(() => import('./pages/respondent/HomePage'))
const FaqPage = lazy(() => import('./pages/respondent/FaqPage'))
const GuidelinePage = lazy(() => import('./pages/respondent/GuidelinePage'))
const SurveyPage = lazy(() => import('./pages/respondent/SurveyPage'))
const ProfilePage = lazy(() => import('./pages/respondent/ProfilePage'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const SignUpPage = lazy(() => import('./pages/auth/SignUpPage'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))

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
          {/* Fullscreen Auth Pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<SignUpPage />} />

          {/* Respondent View Routes */}
          <Route element={<RespLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/guideline" element={<GuidelinePage />} />
            <Route path="/survey/:id" element={<SurveyPage />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute session={session} redirectTo="/login">
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Admin Dashboard View Routes */}
          <Route
            element={
              <ProtectedRoute session={session}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<DashboardPage />} />
            <Route path="/admin/surveys" element={<DashboardPage />} />
            <Route path="/admin/reports" element={<DashboardPage />} />
            <Route path="/admin/respondents" element={<DashboardPage />} />
          </Route>

          {/* Redirects */}
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />
          <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
          
          {/* 404 Fallback - Redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
