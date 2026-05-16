import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type SurveyRow = Database['public']['Tables']['surveys']['Row']
type UserRole = Database['public']['Tables']['profiles']['Row']['role']

function LandingPage() {
  const [homeRole, setHomeRole] = useState<UserRole | null>(null)
  const [availableSurveys, setAvailableSurveys] = useState<SurveyRow[]>([])

  useEffect(() => {
    let active = true

    async function loadHomeState() {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user

      if (!active) {
        return
      }

      if (!user) {
        setHomeRole(null)
        setAvailableSurveys([])
        return
      }

      const { data: profileData } = (await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()) as {
        data: { role: UserRole } | null
        error: { message: string } | null
      }

      if (!active) {
        return
      }

      const role: UserRole = profileData?.role ?? 'awardee'
      setHomeRole(role)

      if (role === 'awardee') {
        const { data: surveyData } = await supabase
          .from('surveys')
          .select('id, title, is_active, created_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (active) {
          setAvailableSurveys((surveyData ?? []) as SurveyRow[])
        }
      }
    }

    void loadHomeState()

    return () => {
      active = false
    }
  }, [])

  const primarySurvey = availableSurveys[0] ?? null
  const primaryActionLabel = homeRole === 'admin' ? 'Ke Dashboard' : 'Daftar Survei'
  const primaryActionHref =
    homeRole === 'admin'
      ? '/admin/dashboard'
      : primarySurvey
        ? `/survey/${primarySurvey.id}`
        : '/login'
  const showPrimaryAction = homeRole === 'admin' || Boolean(primarySurvey)

  return (
    <div className="min-h-screen bg-[#FFFCF4] text-white">
      <Navbar />

      <main>
        <section
          className="relative flex min-h-screen items-end justify-center bg-cover bg-center bg-no-repeat px-5 pb-20"
          style={{ backgroundImage: 'url(/hero_bg.png)' }}
        >
          <div className="absolute inset-0 bg-[#09111f]/42" />

          <div className="relative z-10 text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.4em] text-white/85">
              LPDP Survey Platform
            </p>
            <h1 className="mb-8 text-4xl font-bold tracking-[0.06em] text-white drop-shadow-lg md:text-6xl">
              SURVEI BEASISWA LPDP
            </h1>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              {showPrimaryAction ? (
                <Link
                  to={primaryActionHref}
                  className="rounded-full border-2 border-white bg-[#F97316] px-8 py-3 text-lg font-semibold uppercase tracking-wide text-white transition-all duration-300 hover:-translate-y-1 hover:bg-[#ff8a3d] hover:shadow-lg"
                >
                  {primaryActionLabel}
                </Link>
              ) : (
                <span className="rounded-full border-2 border-white/50 bg-white/10 px-8 py-3 text-lg font-semibold uppercase tracking-wide text-white/85">
                  Belum ada survei aktif
                </span>
              )}

              <Link
                to="/guideline"
                className="rounded-full border-2 border-white bg-white/10 px-8 py-3 text-lg font-semibold uppercase tracking-wide text-white transition-all duration-300 hover:-translate-y-1 hover:bg-white/20 hover:shadow-lg"
              >
                Guideline
              </Link>
            </div>
          </div>
        </section>

        <section className="flex min-h-[600px] flex-col md:flex-row">
          <div className="flex flex-1 flex-col justify-center bg-[linear-gradient(144deg,#2050A5_50%,#1C4999_50%)] px-8 py-14 text-white md:px-16">
            <h2 className="mb-2 text-3xl font-bold tracking-wide">TINGKAT PARTISIPASI</h2>
            <p className="mb-10 text-base opacity-90">per 16 May 2026</p>

            <div className="mb-10">
              <h3 className="-mb-1 text-6xl font-bold transition-all duration-500 md:text-8xl">
                {String(availableSurveys.length).padStart(2, '0')}
              </h3>
              <p className="text-xl font-medium">Survei Aktif</p>
            </div>

            <div>
              <h3 className="-mb-1 text-6xl font-bold transition-all duration-500 md:text-8xl">
                {homeRole === 'admin' ? 'ADMIN' : homeRole === 'awardee' ? 'AWARDEE' : 'GUEST'}
              </h3>
              <p className="text-xl font-medium">Role Saat Ini</p>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-center bg-[#FFFCF4] px-8 py-14 text-[#242428] md:px-16">
            <h2 className="mb-8 text-2xl font-bold leading-snug md:text-4xl">
              SURVEI KEPUASAN PUBLIK ATAS LAYANAN BEASISWA LPDP TAHUN 2026
            </h2>

            <p className="mb-5 text-justify leading-7">
              Selamat bergabung dalam Survei Kepuasan Publik terhadap Layanan LPDP.
              Gunakan satu akun untuk melihat survei aktif atau membuka dashboard admin sesuai role.
            </p>

            <p className="mb-5 text-justify leading-7">
              Sistem ini menyederhanakan akses bagi awardee dan admin tanpa memisahkan alur login.
              Data yang Anda kirim akan digunakan untuk evaluasi layanan dan perbaikan proses.
            </p>

            <p className="mb-5 text-justify leading-7">
              Jika Anda awardee, klik Daftar Survei untuk mulai mengisi survei aktif. Jika Anda admin,
              gunakan tombol Ke Dashboard untuk membuka analitik dan pengelolaan.
            </p>

            <p className="text-justify leading-7">
              Kami menjamin kerahasiaan identitas dan data yang Saudara berikan. Seluruh data akan
              dianalisis secara agregat semata-mata untuk keperluan evaluasi.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-4 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Link
            to="/faq"
            className="rounded-[2rem] border border-slate-200 bg-white p-6 text-[#242428] shadow-[0_24px_60px_rgba(0,51,102,0.08)] transition hover:-translate-y-0.5"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#F97316]">
              FAQ
            </p>
            <h3 className="mt-3 text-2xl font-semibold">Pertanyaan yang sering ditanyakan</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Buka halaman FAQ untuk melihat penjelasan singkat seputar pengisian survei.
            </p>
          </Link>

          <Link
            to="/guideline"
            className="rounded-[2rem] border border-slate-200 bg-[#003366] p-6 text-white shadow-[0_24px_60px_rgba(0,51,102,0.08)] transition hover:-translate-y-0.5"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#F97316]">
              Guideline
            </p>
            <h3 className="mt-3 text-2xl font-semibold">Panduan pengisian survei</h3>
            <p className="mt-3 text-sm leading-7 text-white/75">
              Lihat langkah pengisian dari awal sampai pengiriman jawaban.
            </p>
          </Link>
        </section>
      </main>
    </div>
  )
}

export default LandingPage
