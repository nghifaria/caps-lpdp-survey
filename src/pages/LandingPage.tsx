import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Hero from '../components/Hero'
import Navbar from '../components/Navbar'
import StatCards from '../components/StatCards'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type SurveyRow = Database['public']['Tables']['surveys']['Row']
type UserRole = Database['public']['Tables']['profiles']['Row']['role']

function LandingPage() {
  const location = useLocation()
  const [homeRole, setHomeRole] = useState<UserRole | null>(null)
  const [availableSurveys, setAvailableSurveys] = useState<SurveyRow[]>([])

  useEffect(() => {
    if (!location.hash) {
      return
    }

    const element = document.querySelector(location.hash)

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash])

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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18),_transparent_28%),linear-gradient(180deg,_#003366_0%,_#01213f_46%,_#07111f_100%)] text-white">
      <Navbar />

      <main>
        <Hero />

        {homeRole === 'admin' ? (
          <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] border border-white/10 bg-white/8 p-6 backdrop-blur-xl sm:p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#F97316]">
                    Admin View
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
                    Ringkasan analitik dan akses dashboard
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
                    Pantau respons, buka dashboard penuh, dan kelola role user dari satu tempat.
                  </p>
                </div>

                <Link
                  to="/admin/dashboard"
                  className="inline-flex items-center justify-center rounded-full bg-[#F97316] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(249,115,22,0.35)] transition hover:-translate-y-0.5 hover:bg-[#ff8a3d]"
                >
                  Ke Dashboard
                </Link>
              </div>
            </div>
          </section>
        ) : homeRole === 'awardee' ? (
          <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] border border-white/10 bg-white/8 p-6 backdrop-blur-xl sm:p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#F97316]">
                    Awardee View
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
                    Survei yang tersedia untuk diisi
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
                    Pilih survei aktif di bawah ini untuk melanjutkan pengisian.
                  </p>
                </div>

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/85 transition hover:border-white/25 hover:bg-white/10"
                >
                  Perbarui Login
                </Link>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {availableSurveys.length ? (
                  availableSurveys.map((survey) => (
                    <Link
                      key={survey.id}
                      to={`/survey/${survey.id}`}
                      className="rounded-3xl border border-white/10 bg-[#003366]/70 p-5 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#003366]/85"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316]">
                        Survei Aktif
                      </p>
                      <h3 className="mt-3 text-lg font-semibold text-white">{survey.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-white/72">
                        Klik untuk mulai mengisi survei ini.
                      </p>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-3xl border border-white/10 bg-[#003366]/70 p-5 text-sm leading-7 text-white/72 md:col-span-2 xl:col-span-3">
                    Belum ada survei aktif yang tersedia saat ini.
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : null}

        <StatCards />

        <section id="faq" className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur-xl sm:p-8">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">FAQ</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
              Bagian ini disiapkan sebagai placeholder untuk pertanyaan umum sebelum alur survei
              dan validasi data dihubungkan.
            </p>
          </div>
        </section>

        <section id="guideline" className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-[#F97316]/10 p-6 text-white backdrop-blur-xl sm:p-8">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Guideline</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/80">
              Gunakan tombol Mulai Survei untuk melanjutkan ke alur pengisian berikutnya. Saat ini
              tombol masih visual saja, sesuai tahap pengerjaan.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default LandingPage
