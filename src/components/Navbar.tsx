const navItems = [
  { label: 'Home', href: '#' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Guideline', href: '#guideline' },
]

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#003366]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <a href="#" className="flex items-center gap-3 text-white">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <span className="text-sm font-semibold tracking-[0.24em] text-[#F97316]">LPDP</span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/70">
              LPDP
            </p>
            <p className="text-base font-medium text-white">Survey Platform</p>
          </div>
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-white/75 transition hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}

export default Navbar
