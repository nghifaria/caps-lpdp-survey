import Hero from '../components/Hero'
import Navbar from '../components/Navbar'
import StatCards from '../components/StatCards'

function LandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18),_transparent_28%),linear-gradient(180deg,_#003366_0%,_#01213f_46%,_#07111f_100%)] text-white">
      <Navbar />

      <main>
        <Hero />
        <StatCards />

        <section
          id="faq"
          className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8"
        >
          <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur-xl sm:p-8">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">
              FAQ
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
              Bagian ini disiapkan sebagai placeholder untuk pertanyaan umum sebelum
              alur survei dan validasi data dihubungkan.
            </p>
          </div>
        </section>

        <section
          id="guideline"
          className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8"
        >
          <div className="rounded-[2rem] border border-white/10 bg-[#F97316]/10 p-6 text-white backdrop-blur-xl sm:p-8">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">
              Guideline
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/80">
              Gunakan tombol Mulai Survei untuk melanjutkan ke alur pengisian berikutnya.
              Saat ini tombol masih visual saja, sesuai tahap pengerjaan.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default LandingPage
