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

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Guideline', href: '/guideline' },
  ]

  const authItems = session
    ? [
        { label: 'Profil', href: '/profile' },
      ]
    : [{ label: 'Login', href: '/login' }]

  function isActiveLink(href: string) {
    if (href === '/') {
      return location.pathname === '/' && !location.hash
    }

    return location.pathname === href
  }

  function navLinkClass(href: string) {
    return `transition-colors duration-300 font-medium hover:text-oren-muda ${
      isActiveLink(href) ? 'text-oren-muda' : 'text-black'
    }`
  }

  function mobileNavLinkClass(href: string) {
    return `py-3 font-medium transition-colors duration-300 hover:text-oren-muda ${
      isActiveLink(href) ? 'text-oren-muda' : 'text-black'
    }`
  }

  function closeMenu() {
    setIsMenuOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50 bg-light-grey shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
        <Link to="/" className="flex items-center" onClick={closeMenu}>
          <img
            src="/logo_lpdp.png"
            alt="LPDP Logo"
            className="h-[50px] w-auto object-contain"
          />
        </Link>

        <button
          type="button"
          onClick={() => setIsMenuOpen((current) => !current)}
          className="text-3xl md:hidden"
          aria-label="Toggle Menu"
        >
          ☰
        </button>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link key={item.label} to={item.href} className={navLinkClass(item.href)}>
              {item.label}
            </Link>
          ))}

          <Link to="/admin/login" className={navLinkClass('/admin/login')}>
            Admin
          </Link>

          {authItems.map((item) => (
            <Link key={item.label} to={item.href} className={navLinkClass(item.href)}>
              {item.label}
            </Link>
          ))}

          {session ? (
            <button type="button" onClick={handleLogout} className={navLinkClass('/login')}>
              Logout
            </button>
          ) : null}
        </div>
      </div>

      {isMenuOpen ? (
        <div className="flex flex-col bg-light-grey px-4 pb-4 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={mobileNavLinkClass(item.href)}
              onClick={closeMenu}
            >
              {item.label}
            </Link>
          ))}

          <Link to="/admin/login" className={mobileNavLinkClass('/admin/login')} onClick={closeMenu}>
            Admin
          </Link>

          {authItems.map((item) => (
            <Link key={item.label} to={item.href} className={mobileNavLinkClass(item.href)} onClick={closeMenu}>
              {item.label}
            </Link>
          ))}

          {session ? (
            <button
              type="button"
              onClick={handleLogout}
              className="py-3 text-left font-medium transition-colors duration-300 hover:text-oren-muda text-black"
            >
              Logout
            </button>
          ) : null}
        </div>
      ) : null}
    </nav>
  )
}

export default Navbar
