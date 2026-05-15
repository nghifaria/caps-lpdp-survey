import { useEffect, useState } from 'react'
import LoadingSpinner from './LoadingSpinner'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type SurveyRow = Database['public']['Tables']['surveys']['Row']
type QuestionRow = Database['public']['Tables']['questions']['Row']

type StatCard = {
  label: string
  value: string
  delta: string
}

const fallbackStats: StatCard[] = [
  { label: 'Jumlah Responden', value: '0', delta: 'Data belum tersedia' },
  { label: 'Survei Aktif', value: '0', delta: 'Status survei saat ini' },
  { label: 'Pertanyaan Total', value: '0', delta: 'Struktur form berjalan' },
  { label: 'Dual Likert', value: '0', delta: 'Pertanyaan IPA aktif' },
]

function StatCards() {
  const [stats, setStats] = useState<StatCard[]>(fallbackStats)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadStats() {
      setLoading(true)

      const surveyResult = await supabase
        .from('surveys')
        .select('id, title, is_active')
        .eq('title', 'Survei Kepuasan Layanan LPDP 2026')
        .maybeSingle()

      if (cancelled) {
        return
      }

      if (surveyResult.error || !surveyResult.data) {
        setStats(fallbackStats)
        setLoading(false)
        return
      }

      const resolvedSurvey = surveyResult.data as SurveyRow

      const [questionsResult, responseCountResult] = await Promise.all([
        supabase
          .from('questions')
          .select('id, question_type')
          .eq('survey_id', resolvedSurvey.id),
        (supabase as any).rpc('get_survey_response_count', {
          survey_uuid: resolvedSurvey.id,
        }),
      ])

      if (cancelled) {
        return
      }

      const questionRows = (questionsResult.data ?? []) as QuestionRow[]
      const dualLikertCount = questionRows.filter((question) => question.question_type === 'dual_likert').length
      const totalQuestions = questionRows.length
      const responseCount = Number(responseCountResult.data ?? 0)

      setStats([
        {
          label: 'Jumlah Responden',
          value: responseCount.toLocaleString('id-ID'),
          delta: 'Data asli dari Supabase',
        },
        {
          label: 'Survei Aktif',
          value: resolvedSurvey.is_active ? '1' : '0',
          delta: resolvedSurvey.is_active ? 'Survei masih dibuka' : 'Survei ditutup',
        },
        {
          label: 'Pertanyaan Total',
          value: totalQuestions.toString(),
          delta: 'Struktur form aktif',
        },
        {
          label: 'Dual Likert',
          value: dualLikertCount.toString(),
          delta: 'Pertanyaan IPA tersedia',
        },
      ])

      setLoading(false)
    }

    void loadStats()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8" aria-label="Statistik ringkas">
      {loading ? (
        <LoadingSpinner />
      ) : (
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
      )}
    </section>
  )
}

export default StatCards
