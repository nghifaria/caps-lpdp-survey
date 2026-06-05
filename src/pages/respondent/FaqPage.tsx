import { useState } from 'react'

type FaqItem = {
  id: string
  question: string
  answer: string
}

const faqData: FaqItem[] = [
  {
    id: 'faq1',
    question: 'Apa itu survei kepuasan layanan LPDP?',
    answer:
      'Survei ini digunakan untuk mengukur pengalaman awardee dalam menggunakan layanan LPDP dan menjadi dasar evaluasi perbaikan layanan.',
  },
  {
    id: 'faq2',
    question: 'Siapa yang dapat mengisi survei?',
    answer:
      'Survei ini disediakan untuk awardee yang sudah memiliki akun dan sedang login pada sistem.',
  },
  {
    id: 'faq3',
    question: 'Apakah saya bisa melanjutkan pengisian yang sempat tertunda?',
    answer:
      'Bisa. Sistem akan menyimpan draft pengisian di LocalStorage sehingga Anda bisa melanjutkan dari langkah terakhir.',
  },
  {
    id: 'faq4',
    question: 'Apakah data saya aman?',
    answer:
      'Ya. Identitas dan jawaban Anda diproses secara agregat untuk kebutuhan evaluasi layanan, bukan untuk publikasi data pribadi.',
  },
  {
    id: 'faq5',
    question: 'Ke mana saya harus bertanya jika ada kendala?',
    answer:
      'Silakan gunakan kontak resmi LPDP atau kembali ke halaman panduan untuk memastikan langkah pengisian sudah benar.',
  },
]

const FaqPage = () => {
  const [activeItem, setActiveItem] = useState('')

  const toggleItem = (id: string) => {
    setActiveItem(activeItem === id ? '' : id)
  }

  return (
    <section className="bg-broken-white px-5 py-16 text-center">
      <div className="mx-auto max-w-6xl">
        {/* Title */}
        <h1 className="mb-5 text-4xl font-bold text-ash md:text-5xl">SOME FAQS</h1>

        {/* Description */}
        <p className="mx-auto mb-10 max-w-3xl text-base leading-7 text-black md:text-lg">
          Temukan jawaban singkat untuk pertanyaan umum sebelum mulai mengisi survei.
        </p>

        {/* FAQ Items */}
        <div className="mx-auto max-w-4xl space-y-5">
          {faqData.map((faq) => {
            const isOpen = activeItem === faq.id

            return (
              <div
                key={faq.id}
                className="overflow-hidden rounded-2xl bg-[#DE7A49] text-left text-white shadow-md"
              >
                {/* Question */}
                <button
                  type="button"
                  onClick={() => toggleItem(faq.id)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left transition-all duration-300"
                >
                  <span className="text-base font-semibold md:text-lg">
                    {faq.question}
                  </span>
                  <span className="text-2xl font-bold">{isOpen ? '−' : '+'}</span>
                </button>

                {/* Answer */}
                <div
                  className={`grid transition-all duration-300 ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-sm leading-7 md:text-base">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default FaqPage
