import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { supabase } from './lib/supabase'
import type { Database } from './types/database'
import LandingPage from './pages/LandingPage'
import AdminLogin from './pages/AdminLogin'
import SurveyPage from './pages/SurveyPage'
import ProtectedRoute from './components/ProtectedRoute'

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
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/survey/:id" element={<SurveyPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute session={session}>
              <Navigate to="/" replace />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
