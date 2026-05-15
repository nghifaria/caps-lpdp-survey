const stats = [
  { label: 'Jumlah Responden', value: '1.284', delta: '+14% minggu ini' },
  { label: 'Success Rate', value: '99.2%', delta: 'Form berjalan stabil' },
  { label: 'Rata-rata Rating', value: '4.72/5', delta: 'Dari 5 skala penilaian' },
  { label: 'Wilayah Aktif', value: '34 Provinsi', delta: 'Cakupan nasional' },
]

function StatCards() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8" aria-label="Statistik ringkas">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-3xl border border-white/10 bg-white/6 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.16)] backdrop-blur-xl"
          >
            <p className="text-sm font-medium text-white/60">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
              {stat.value}
            </p>
            <p className="mt-2 text-sm text-white/70">{stat.delta}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default StatCards
