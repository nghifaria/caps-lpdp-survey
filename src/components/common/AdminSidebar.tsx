import { NavLink, useNavigate } from 'react-router-dom'
import {
  ChartLineUp,
  ShieldCheckered,
  Archive,
  TreeStructure,
  SignOut,
  UserCircle,
  Globe
} from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useTranslation } from 'react-i18next'

const adminData = {
  name: 'Admin LPDP',
  email: 'adminlpdp@gmail.com',
}

const AdminSidebar = () => {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const menuItems = [
    {
      name: t('sidebar.analytics', 'Analitik'),
      path: '/admin',
      icon: ChartLineUp,
    },
    {
      name: t('sidebar.critical_feedback', 'Umpan Balik Kritis'),
      path: '/admin/critical-feedback',
      icon: ShieldCheckered,
    },
    {
      name: t('sidebar.manage_surveys', 'Kelola Survei'),
      path: '/admin/surveys',
      icon: Archive,
    },
    {
      name: t('sidebar.manage_users', 'Manajemen Pengguna'),
      path: '/admin/respondents',
      icon: TreeStructure,
    },
  ]

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  function toggleLanguage() {
    const newLang = i18n.language === 'id' ? 'en' : 'id'
    void i18n.changeLanguage(newLang)
  }

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-[230px] flex-col justify-between bg-[#242428] px-5 py-6 text-white print:hidden">
      {/* Top Section */}
      <div className="pt-16">
        {/* Sidebar Header */}
        <div className="absolute left-0 top-0 flex h-16 w-full items-center gap-6 bg-light-grey px-5">
          {/* Logo */}
          <img src="/logo_lpdp.png" alt="Logo LPDP" className="h-8 w-auto object-contain" />

          {/* Title */}
          <div className="leading-tight">
            <h1 className="text-xs font-semibold text-oren-muda">Survei</h1>
            <h1 className="text-xs font-semibold text-oren-muda">Awardee LPDP</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-3">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                    isActive ? 'bg-oren-muda text-white' : 'text-white hover:bg-[#DE7A49]/20'
                  }`
                }
              >
                <Icon size={22} weight="regular" className="shrink-0 opacity-80" />
                {item.name}
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div>
        {/* User Info */}
        <div className="mb-5 flex items-center gap-1">
          {/* Profile Avatar */}
          <div className="flex h-14 w-14 items-center justify-center">
            <UserCircle size={30} weight="regular" className="text-white" />
          </div>

          {/* User Detail */}
          <div>
            <h2 className="text-sm font-semibold">{adminData.name}</h2>
            <p className="text-xs text-gray-300">{adminData.email}</p>
          </div>
        </div>

        {/* Language Toggle */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-light-grey/20 px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-light-grey/10"
        >
          <Globe size={22} weight="regular" />
          <span>{i18n.language === 'id' ? 'English' : 'Indonesia'}</span>
        </button>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-oren-muda px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#C9683B]"
        >
          <SignOut size={22} weight="regular" />
          <span>{t('sidebar.logout', 'Keluar')}</span>
        </button>
      </div>
    </aside>
  )
}

export default AdminSidebar
