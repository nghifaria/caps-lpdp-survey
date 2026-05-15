import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type SurveyRow = Database['public']['Tables']['surveys']['Row']
type QuestionRow = Database['public']['Tables']['questions']['Row']

const surveyTitle = 'Survei Kepuasan Layanan LPDP 2026'

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

function SurveyPage() {
  const { id } = useParams<{ id: string }>()
  const surveyParam = id ?? ''
  const [survey, setSurvey] = useState<SurveyRow | null>(null)
  const [questions, setQuestions] = useState<QuestionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!surveyParam) {
      setError('Survey ID tidak ditemukan di URL.')
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadSurvey() {
      setLoading(true)
      setError(null)

      const baseQuery = supabase
        .from('surveys')
        .select('id, title, is_active, created_at')

      const surveyResult = isUuid(surveyParam)
        ? await baseQuery.eq('id', surveyParam).maybeSingle()
        : await baseQuery.eq('title', surveyTitle).maybeSingle()

      if (surveyResult.error) {
        if (!cancelled) {
          setError(surveyResult.error.message)
          setLoading(false)
        }
        return
      }

      let resolvedSurvey: SurveyRow | null = (surveyResult.data as SurveyRow | null) ?? null

      if (!resolvedSurvey) {
        const fallbackResult = await baseQuery.eq('title', surveyTitle).maybeSingle()

        if (fallbackResult.error) {
          if (!cancelled) {
            setError(fallbackResult.error.message)
            setLoading(false)
          }
          return
        }

        resolvedSurvey = (fallbackResult.data as SurveyRow | null) ?? null
      }

      if (!resolvedSurvey) {
        if (!cancelled) {
          setError('Data survey seed tidak ditemukan.')
          setLoading(false)
        }
        return
      }

      const resolvedSurveyId = resolvedSurvey.id

      const questionsResult = await supabase
        .from('questions')
        .select('id, survey_id, question_text, question_type, options, is_required, branching_logic')
        .eq('survey_id', resolvedSurveyId)

      if (!cancelled) {
        if (questionsResult.error) {
          setError(questionsResult.error.message)
        } else {
          setSurvey(resolvedSurvey)
          setQuestions(questionsResult.data ?? [])
        }
        setLoading(false)
      }
    }

    void loadSurvey()

    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f8fbff_0%,_#eef4fb_100%)] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(0,51,102,0.08)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#F97316]">
          Survey Shell
        </p>

        {loading ? (
          <p className="mt-6 text-sm text-slate-600">Memuat data survey...</p>
        ) : error ? (
          <p className="mt-6 text-sm text-red-600">{error}</p>
        ) : (
          <>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#003366] sm:text-4xl">
              {survey?.title}
            </h1>

            <section className="mt-8 rounded-3xl bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-900">Daftar Pertanyaan</h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                {questions.map((question) => (
                  <li
                    key={question.id}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <p className="font-medium text-slate-900">{question.question_text}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {question.question_type}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </main>
  )
}

export default SurveyPage