type GuidelineStep = {
  id: string
  number: string
  title: string
}

const guidelineSteps: GuidelineStep[] = [
  {
    id: 'step1',
    number: '[01]',
    title: 'Langkah 1: Isi Data Diri',
  },
  {
    id: 'step2',
    number: '[02]',
    title: 'Langkah 2: Evaluasi Tahap Pendaftaran',
  },
  {
    id: 'step3',
    number: '[03]',
    title: 'Langkah 3: Evaluasi Tahap Seleksi',
  },
  {
    id: 'step4',
    number: '[04]',
    title: 'Langkah 4: Evaluasi Penerimaan Manfaat Beasiswa',
  },
  {
    id: 'step5',
    number: '[05]',
    title: 'Langkah 5: Penanganan Keluhan',
  },
  {
    id: 'step6',
    number: '[06]',
    title: 'Langkah 6: Penilaian Petugas Layanan (CSO)',
  },
  {
    id: 'step7',
    number: '[07]',
    title: 'Langkah 7: Penilaian Umum',
  },
  {
    id: 'step8',
    number: '[08]',
    title: 'Langkah 8: Selesai & Kirim',
  },
]

const GuidelinePage = () => {
  return (
    <section className="min-h-screen bg-broken-white px-5 py-16 animate-fade-in">
      <div className="mx-auto max-w-4xl text-center">
        {/* Title */}
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-oren mb-2">
          Panduan
        </p>
        <h1 className="mb-5 text-4xl font-bold uppercase tracking-tight text-navy md:text-6xl">
          Guideline
        </h1>

        {/* Description */}
        <p className="mx-auto mb-16 max-w-3xl text-sm leading-7 text-ash/80 md:text-base">
          Ikuti langkah di bawah ini agar proses pengisian survei berjalan lancar dari awal sampai akhir.
        </p>

        {/* Guideline Steps */}
        <div className="mt-10 flex flex-col gap-6 text-left">
          {guidelineSteps.map((step) => (
            <div
              key={step.id}
              className="cursor-pointer border-b border-light-grey pb-6 transition-all duration-300 hover:translate-x-2 select-none"
            >
              <span className="mr-3 text-sm font-bold text-oren md:text-base">
                {step.number}
              </span>

              <span className="text-lg font-semibold text-ash md:text-2xl transition-colors hover:text-oren">
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default GuidelinePage
