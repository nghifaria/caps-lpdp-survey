import { useState } from 'react'
import Navbar from '../components/Navbar'

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

function FAQ() {
  const [activeItem, setActiveItem] = useState('faq1')

  function toggleItem(id: string) {
    setActiveItem(activeItem === id ? '' : id)
  }

  return (
    <main className="min-h-screen bg-[#FFFCF4] text-center text-[#242428]">
      <Navbar />

      <div className="mx-auto max-w-6xl px-5 py-16">
        <h1 className="mb-5 text-4xl font-bold tracking-tight text-[#003366] md:text-5xl">FAQ</h1>
        <p className="mx-auto mb-10 max-w-3xl text-base leading-7 text-slate-700 md:text-lg">
          Temukan jawaban singkat untuk pertanyaan umum sebelum mulai mengisi survei.
        </p>

        <div className="mx-auto max-w-4xl space-y-5 text-left">
          {faqData.map((faq) => {
            const isOpen = activeItem === faq.id

            return (
              <div key={faq.id} className="overflow-hidden rounded-2xl bg-[#D97843] text-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)]">
                <button
                  type="button"
                  onClick={() => toggleItem(faq.id)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left transition-all duration-300"
                >
                  <span className="text-base font-semibold md:text-lg">{faq.question}</span>
                  <span className="text-2xl font-bold">{isOpen ? '−' : '+'}</span>
                </button>

                <div
                  className={`grid transition-all duration-300 ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-sm leading-7 md:text-base">{faq.answer}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}

export default FAQ