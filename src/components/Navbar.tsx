import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type NavSession = {
  user?: {
    id: string
  } | null
} | null

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [session, setSession] = useState<NavSession>(null)

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

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'FAQ', href: '/#faq' },
    { label: 'Guideline', href: '/#guideline' },
  ]

  function isActiveLink(href: string) {
    if (href === '/') {
      return location.pathname === '/' && !location.hash
    }

    if (href === '/#faq') {
      return location.pathname === '/' && location.hash === '#faq'
    }

    if (href === '/#guideline') {
      return location.pathname === '/' && location.hash === '#guideline'
    }

    return location.pathname === href
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#003366]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 text-white">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <span className="text-sm font-semibold tracking-[0.24em] text-[#F97316]">LPDP</span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/70">
              LPDP
            </p>
            <p className="text-base font-medium text-white">Survey Platform</p>
          </div>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={`text-sm font-medium transition hover:text-white ${
                isActiveLink(item.href) ? 'text-white font-semibold' : 'text-white/75'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/admin/login"
            className={`text-sm font-medium transition hover:text-white ${
              isActiveLink('/admin/login') ? 'text-white font-semibold' : 'text-white/75'
            }`}
          >
            Admin
          </Link>
          {session ? (
            <>
              <Link
                to="/profile"
                className={`text-sm font-medium transition hover:text-white ${
                  isActiveLink('/profile') ? 'text-white font-semibold' : 'text-white/75'
                }`}
              >
                Profil
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-medium text-white/75 transition hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="text-sm font-medium text-white/75 transition hover:text-white"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Navbar
