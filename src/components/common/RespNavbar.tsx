import { useEffect, useState, useRef } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

type NavSession = {
  user?: {
    id: string
  } | null
} | null

const RespNavbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [session, setSession] = useState<NavSession>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true

    async function fetchProfile(userId: string) {
      const { data, error } = await (supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', userId)
        .maybeSingle() as any)

      if (active && !error && data) {
        setProfile({
          full_name: data.full_name ?? null,
          avatar_url: data.avatar_url ?? null,
        })
      }
    }

    async function loadSession() {
      const { data } = await supabase.auth.getSession()

      if (active) {
        const currentSession = data.session
        setSession(currentSession)
        if (currentSession?.user?.id) {
          void fetchProfile(currentSession.user.id)
        } else {
          setProfile(null)
        }
      }
    }

    void loadSession()

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession)
        if (nextSession?.user?.id) {
          void fetchProfile(nextSession.user.id)
        } else {
          setProfile(null)
        }
      }
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [location.pathname])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setIsMenuOpen(false)
    setIsDropdownOpen(false)
    navigate('/login', { replace: true })
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `transition-colors duration-300 font-medium hover:text-oren-muda ${
      isActive ? 'text-oren-muda' : 'text-black'
    }`

  return (
    <nav className="sticky top-0 z-50 bg-[#E7E4DC] shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
        {/* Logo */}
        <Link to="/" className="flex items-center" onClick={closeMenu}>
          <img
            src="/logo_lpdp.png"
            alt="LPDP Logo"
            className="h-[50px] w-auto object-contain"
          />
        </Link>

        {/* Hamburger Button */}
        <button
          onClick={toggleMenu}
          className="text-3xl md:hidden focus:outline-none cursor-pointer"
          aria-label="Toggle Menu"
        >
          ☰
        </button>

        {/* Desktop Menu */}
        <div className="hidden items-center gap-8 md:flex">
          <NavLink to="/" className={navLinkClass} onClick={closeMenu}>
            Home
          </NavLink>

          <NavLink to="/faq" className={navLinkClass} onClick={closeMenu}>
            FAQ
          </NavLink>

          <NavLink to="/guideline" className={navLinkClass} onClick={closeMenu}>
            Guideline
          </NavLink>

          {session ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 focus:outline-none cursor-pointer group"
              >
                <div className="h-8 w-8 overflow-hidden rounded-full border border-light-grey bg-white shadow-sm flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-navy text-white text-sm font-semibold uppercase">
                      {profile?.full_name ? profile.full_name.charAt(0) : 'U'}
                    </div>
                  )}
                </div>
                <svg
                  className={`h-4 w-4 text-black transition-transform duration-200 group-hover:text-oren-muda ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-48 origin-top-right rounded-2xl border border-light-grey bg-white p-2 shadow-lg ring-1 ring-black/5 z-50">
                  <Link
                    to="/profile"
                    onClick={() => {
                      setIsDropdownOpen(false)
                      closeMenu()
                    }}
                    className="flex w-full items-center px-4 py-2.5 text-sm font-semibold text-ash rounded-xl transition hover:bg-butter/15 hover:text-oren"
                  >
                    Lihat Profil
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false)
                      void handleLogout()
                    }}
                    className="flex w-full items-center px-4 py-2.5 text-sm font-semibold text-red-600 rounded-xl transition hover:bg-red-50 hover:text-red-700 cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <NavLink to="/login" className={navLinkClass} onClick={closeMenu}>
              Login
            </NavLink>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="flex flex-col bg-[#E7E4DC] px-4 pb-4 md:hidden">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `py-3 font-medium transition-colors duration-300 hover:text-oren-muda ${
                isActive ? 'text-oren-muda' : 'text-black'
              }`
            }
            onClick={closeMenu}
          >
            Home
          </NavLink>

          <NavLink
            to="/faq"
            className={({ isActive }) =>
              `py-3 font-medium transition-colors duration-300 hover:text-oren-muda ${
                isActive ? 'text-oren-muda' : 'text-black'
              }`
            }
            onClick={closeMenu}
          >
            FAQ
          </NavLink>

          <NavLink
            to="/guideline"
            className={({ isActive }) =>
              `py-3 font-medium transition-colors duration-300 hover:text-oren-muda ${
                isActive ? 'text-oren-muda' : 'text-black'
              }`
            }
            onClick={closeMenu}
          >
            Guideline
          </NavLink>

          {session ? (
            <div className="border-t border-black/10 mt-3 pt-3">
              <div className="flex items-center gap-3 px-2 py-2 mb-2">
                <div className="h-10 w-10 overflow-hidden rounded-full border border-light-grey bg-white shadow-sm flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-navy text-white text-sm font-semibold uppercase">
                      {profile?.full_name ? profile.full_name.charAt(0) : 'U'}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-black font-semibold text-sm">
                    {profile?.full_name || 'User'}
                  </div>
                  <div className="text-xs text-ash/60">
                    Awardee
                  </div>
                </div>
              </div>
              <Link
                to="/profile"
                className="block py-2.5 px-2 font-semibold text-ash hover:text-oren transition-colors"
                onClick={closeMenu}
              >
                Lihat Profil
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full text-left py-2.5 px-2 font-semibold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `py-3 font-medium transition-colors duration-300 hover:text-oren-muda ${
                  isActive ? 'text-oren-muda' : 'text-black'
                }`
              }
              onClick={closeMenu}
            >
              Login
            </NavLink>
          )}
        </div>
      )}
    </nav>
  )
}

export default RespNavbar
