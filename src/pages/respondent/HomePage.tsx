import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database'

type SurveyRow = Database['public']['Tables']['surveys']['Row']
type UserRole = Database['public']['Tables']['profiles']['Row']['role']

function formatSurveyDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

const HomePage = () => {
  const navigate = useNavigate()
  const [homeRole, setHomeRole] = useState<UserRole | null>(null)
  const [availableSurveys, setAvailableSurveys] = useState<SurveyRow[]>([])
  const [totalResponden, setTotalResponden] = useState<number | null>(null)
  const [totalAwardees, setTotalAwardees] = useState<number | null>(null)

  const currentDateStr = useMemo(() => {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date())
  }, [])

  const formatNumber = (val: number | null) => {
    if (val === null) return '...'
    return new Intl.NumberFormat('id-ID').format(val)
  }

  useEffect(() => {
    let active = true

    async function loadHomeState() {
      // Fetch dynamic stats for everyone
      const { count: respCount } = await (supabase
        .from('responses')
        .select('*', { count: 'exact', head: true }) as any)

      const { count: profileCount } = await (supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'awardee') as any)

      if (active) {
        setTotalResponden(respCount ?? 0)
        setTotalAwardees(profileCount ?? 0)
      }

      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user

      if (!active) return

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

      if (!active) return

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

  const handleStartFirstSurvey = () => {
    if (availableSurveys.length > 0) {
      navigate(`/survey/${availableSurveys[0].id}`)
    } else {
      navigate('/guideline')
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section
        className="relative flex min-h-screen items-end justify-center bg-cover bg-center bg-no-repeat px-5 pb-20 animate-fade-in"
        style={{ backgroundImage: `url(/hero_bg.png)` }}
      >
        <div className="absolute inset-0 bg-[#09111f]/42" />

        {/* Content */}
        <div className="relative z-10 text-center">
          <h1 className="mb-8 text-4xl font-bold tracking-wide text-white drop-shadow-lg md:text-6xl">
            SURVEI BEASISWA LPDP
          </h1>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            {homeRole === 'awardee' && availableSurveys.length > 0 ? (
              <button
                onClick={handleStartFirstSurvey}
                className="rounded-full border-2 border-white bg-oren px-8 py-3 text-lg font-semibold uppercase tracking-wide text-white transition-all duration-300 hover:-translate-y-1 hover:bg-oren-muda hover:shadow-lg cursor-pointer"
              >
                Isi Sekarang
              </button>
            ) : homeRole === 'admin' ? (
              <Link
                to="/admin"
                className="rounded-full border-2 border-white bg-oren px-8 py-3 text-lg font-semibold uppercase tracking-wide text-white transition-all duration-300 hover:-translate-y-1 hover:bg-oren-muda hover:shadow-lg text-center"
              >
                Ke Dashboard Admin
              </Link>
            ) : (
              <Link
                to="/login"
                className="rounded-full border-2 border-white bg-oren px-8 py-3 text-lg font-semibold uppercase tracking-wide text-white transition-all duration-300 hover:-translate-y-1 hover:bg-oren-muda hover:shadow-lg text-center"
              >
                Isi Sekarang
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Survey Hub Section (Dynamic Surveys for Awardee) */}
      {homeRole === 'awardee' && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 w-full">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-oren">
              Survey Hub
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight tracking-[-0.03em] text-navy">
              Pilih kuesioner aktif yang ingin Anda isi
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ash/80">
              Semua survei aktif ditampilkan di bawah ini. Klik kartu yang sesuai untuk memulai.
            </p>
          </div>

          {availableSurveys.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {availableSurveys.map((survey) => (
                <article
                  key={survey.id}
                  className="group rounded-2xl border border-light-grey bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 ease-in-out transform-gpu hover:-translate-y-1 hover:shadow-lg hover:border-oren/30"
                >
                  <div className="flex h-full flex-col justify-between gap-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-oren">
                        Survei Aktif
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold tracking-tight tracking-[-0.03em] text-navy">
                        {survey.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-ash/70">
                        Dibuat pada {formatSurveyDate(survey.created_at)}
                      </p>
                    </div>

                    <Link
                      to={`/survey/${survey.id}`}
                      className="inline-flex w-full items-center justify-center rounded-xl bg-oren px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(189,91,44,0.28)] transition-all duration-300 hover:brightness-110 active:scale-95 text-center"
                    >
                      Mulai Isi Survei
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-light-grey bg-white px-6 py-8 text-sm leading-7 text-ash/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              Saat ini tidak ada survei aktif untuk Anda.
            </div>
          )}
        </section>
      )}

      {/* Guideline & FAQ Previews - Split Section */}
      <section className="flex min-h-[400px] flex-col md:flex-row w-full animate-fade-in">
        {/* Left Block: Guideline */}
        <div className="flex flex-1 flex-col justify-center bg-[linear-gradient(135deg,#1C4999_0%,#0f2e6b_100%)] px-8 py-16 text-white md:px-16 select-none">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-light-blue mb-2">
            Panduan Pengisian
          </p>
          <h2 className="text-3xl font-bold tracking-wide uppercase mb-4">
            Petunjuk Pelaksanaan
          </h2>
          <p className="mb-8 text-sm leading-7 opacity-90 text-justify max-w-xl">
            Pahami 8 tahapan pengisian kuesioner mulai dari pengisian data diri, penilaian tahapan pendaftaran, seleksi, hingga penyaluran manfaat beasiswa LPDP secara detail dan sistematis.
          </p>
          <div>
            <Link
              to="/guideline"
              className="inline-flex items-center gap-2 rounded-xl bg-oren px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-oren-muda hover:-translate-y-0.5"
            >
              Lihat Panduan Lengkap <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Right Block: FAQ */}
        <div className="flex flex-1 flex-col justify-center bg-[#242424] px-8 py-16 text-white md:px-16 select-none">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-oren mb-2">
            Tanya Jawab
          </p>
          <h2 className="text-3xl font-bold tracking-wide uppercase mb-4">
            Frequently Asked Questions
          </h2>
          <p className="mb-8 text-sm leading-7 opacity-90 text-justify max-w-xl">
            Ada pertanyaan tentang penyimpanan draft pengisian, keamanan kerahasiaan data pribadi, atau cara melaporkan kendala teknis sistem? Temukan ringkasan jawabannya langsung di sini.
          </p>
          <div>
            <Link
              to="/faq"
              className="inline-flex items-center gap-2 rounded-xl bg-transparent border border-light-grey px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 hover:-translate-y-0.5"
            >
              Lihat Semua FAQ <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="flex min-h-[600px] flex-col md:flex-row w-full">
        {/* Left Section */}
        <div className="flex flex-1 flex-col justify-center bg-[linear-gradient(144deg,#2050A5_50%,#1C4999_50%)] px-8 py-14 text-white md:px-16">
          <h2 className="mb-2 text-3xl font-bold tracking-wide">TINGKAT PARTISIPASI</h2>
          <p className="mb-10 text-base opacity-90">per {currentDateStr}</p>

          <div className="mb-10">
            <h3 className="-mb-1 text-6xl font-bold transition-all duration-500 md:text-8xl">
              {formatNumber(totalResponden)}
            </h3>
            <p className="text-xl font-medium">Total Responden</p>
          </div>

          <div>
            <h3 className="-mb-1 text-6xl font-bold transition-all duration-500 md:text-8xl">
              {formatNumber(totalAwardees)}
            </h3>
            <p className="text-xl font-medium">Penerima Beasiswa</p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex flex-1 flex-col justify-center bg-ash px-8 py-14 text-white md:px-16">
          <h2 className="mb-8 text-2xl font-bold leading-snug md:text-4xl text-left">
            SURVEI KEPUASAN PUBLIK ATAS LAYANAN BEASISWA LPDP TAHUN 2026
          </h2>

          <p className="mb-5 text-justify leading-7">
            Selamat bergabung dalam Survei Kepuasan Publik terhadap Layanan LPDP Tahun 2026.
          </p>

          <p className="mb-5 text-justify leading-7">
            LPDP bekerja sama dengan Institut Pertanian Bogor (IPB) menyelenggarakan survei ini guna
            mengevaluasi kualitas layanan beasiswa yang Saudara terima pada tahun 2026. Partisipasi
            dan masukan dari Saudara sangat kami harapkan sebagai bahan perbaikan dan pengembangan
            layanan LPDP ke depan.
          </p>

          <p className="mb-5 text-justify leading-7">
            Kami mohon Saudara mengisi survei ini secara objektif berdasarkan pengalaman pribadi dalam
            berinteraksi dengan unit layanan beasiswa LPDP.
          </p>

          <p className="text-justify leading-7">
            Kami menjamin kerahasiaan identitas dan data yang Saudara berikan. Seluruh data akan
            dianalisis secara agregat semata-mata untuk keperluan evaluasi. Atas perhatian dan
            partisipasi Saudara, kami ucapkan terima kasih.
          </p>
        </div>
      </section>
    </div>
  )
}

export default HomePage
