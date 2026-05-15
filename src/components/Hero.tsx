import { Link } from 'react-router-dom'

const surveyRouteId = 'survei-kepuasan-layanan-lpdp-2026'

function Hero() {
  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:px-8 lg:pb-16 lg:pt-20">
      <div className="max-w-3xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#F97316]/20 bg-[#F97316]/10 px-4 py-2 text-sm font-medium text-[#F97316]">
          <span className="h-2 w-2 rounded-full bg-[#F97316]" />
          Survei resmi untuk awardee LPDP 2026
        </div>

        <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
          Survei Kepuasan Layanan LPDP 2026
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
          Bantu tim LPDP membaca pengalaman awardee secara lebih cepat, lebih rapi,
          dan lebih terukur untuk mendukung perbaikan layanan yang berdampak.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            to={`/survey/${surveyRouteId}`}
            className="inline-flex items-center justify-center rounded-full bg-[#F97316] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(249,115,22,0.35)] transition hover:-translate-y-0.5 hover:bg-[#ff8a3d]"
          >
            Mulai Survei
          </Link>
          <a
            href="#faq"
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/85 transition hover:border-white/25 hover:bg-white/10"
          >
            Lihat FAQ
          </a>
        </div>
      </div>

      <div className="relative">
        <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[#F97316]/25 via-transparent to-white/5 blur-2xl" />
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/60">Snapshot sesi ini</p>
              <p className="mt-1 text-2xl font-semibold text-white">Live Dashboard</p>
            </div>
            <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
              99.2% uptime
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#003366]/80 p-4">
              <p className="text-sm text-white/60">Respon terkumpul</p>
              <p className="mt-3 text-3xl font-semibold text-white">1.284</p>
              <p className="mt-2 text-sm text-emerald-300">+14% dari minggu lalu</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/60">Rata-rata kepuasan</p>
              <p className="mt-3 text-3xl font-semibold text-white">4.72/5</p>
              <p className="mt-2 text-sm text-[#F97316]">Stabil di kategori baik</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium text-white/60">Catatan rapat kating</p>
            <p className="mt-2 text-sm leading-7 text-white/80">
              “Mayoritas awardee sudah mengisi, tinggal dorong wilayah dengan respons
              rendah agar dashboard makin representatif.”
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
