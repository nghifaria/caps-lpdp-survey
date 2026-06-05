import { useEffect, useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

type NavSession = {
  user?: {
    id: string
  } | null
} | null

const RespNavbar = () => {
  const navigate = useNavigate()
  const [session, setSession] = useState<NavSession>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
    setIsMenuOpen(false)
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
          className="text-3xl md:hidden"
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

          <NavLink to="/admin" className={navLinkClass} onClick={closeMenu}>
            Admin
          </NavLink>

          {session ? (
            <>
              <NavLink to="/profile" className={navLinkClass} onClick={closeMenu}>
                Profil
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="transition-colors duration-300 font-medium hover:text-oren-muda text-black cursor-pointer"
              >
                Logout
              </button>
            </>
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

          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `py-3 font-medium transition-colors duration-300 hover:text-oren-muda ${
                isActive ? 'text-oren-muda' : 'text-black'
              }`
            }
            onClick={closeMenu}
          >
            Admin
          </NavLink>

          {session ? (
            <>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `py-3 font-medium transition-colors duration-300 hover:text-oren-muda ${
                    isActive ? 'text-oren-muda' : 'text-black'
                  }`
                }
                onClick={closeMenu}
              >
                Profil
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="py-3 text-left font-medium transition-colors duration-300 hover:text-oren-muda text-black cursor-pointer"
              >
                Logout
              </button>
            </>
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
