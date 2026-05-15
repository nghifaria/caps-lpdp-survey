import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import LoadingSpinner from '../components/LoadingSpinner'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type SurveyRow = Database['public']['Tables']['surveys']['Row']
type ResponseRow = Database['public']['Tables']['responses']['Row']
type AnswerRow = Database['public']['Tables']['answers']['Row']
type QuestionRow = Database['public']['Tables']['questions']['Row']

type ResponseAnswer = AnswerRow & {
  questions: Pick<QuestionRow, 'id' | 'question_text' | 'question_type'> | null
}

type ResponseWithAnswers = ResponseRow & {
  answers: ResponseAnswer[] | null
}

type CsvRow = {
  response_id: string
  submitted_at: string
  question_id: string
  question_text: string
  performance: number
  importance: number
  reason: string
}

type IpaPoint = {
  question_id: string
  question_text: string
  performance: number
  importance: number
  quadrant: string
}

function AdminDashboard() {
  const [survey, setSurvey] = useState<SurveyRow | null>(null)
  const [responses, setResponses] = useState<ResponseWithAnswers[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setLoading(true)
      setError(null)

      const surveyResult = await supabase
        .from('surveys')
        .select('id, title, is_active, created_at')
        .eq('title', 'Survei Kepuasan Layanan LPDP 2026')
        .maybeSingle()

      if (surveyResult.error) {
        if (!cancelled) {
          setError(surveyResult.error.message)
          setLoading(false)
        }
        return
      }

      const resolvedSurvey = surveyResult.data as SurveyRow | null

      if (!resolvedSurvey) {
        if (!cancelled) {
          setError('Survey seed tidak ditemukan.')
          setLoading(false)
        }
        return
      }

      const responsesResult = await supabase
        .from('responses')
        .select(
          'id, survey_id, submitted_at, answers(id, response_id, question_id, text_value, score_performance, score_importance, reason, questions(id, question_text, question_type))',
        )
        .eq('survey_id', resolvedSurvey.id)
        .order('submitted_at', { ascending: false })

      if (!cancelled) {
        if (responsesResult.error) {
          setError(responsesResult.error.message)
        } else {
          setSurvey(resolvedSurvey)
          setResponses((responsesResult.data ?? []) as ResponseWithAnswers[])
        }
        setLoading(false)
      }
    }

    void loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  const { ipaPoints, csvRows, means } = useMemo(() => {
    const rawRows: CsvRow[] = []
    const aggregates = new Map<
      string,
      { questionText: string; performanceSum: number; importanceSum: number; count: number }
    >()

    for (const response of responses) {
      for (const answer of response.answers ?? []) {
        if (answer.questions?.question_type !== 'dual_likert') {
          continue
        }

        const performance = Number(answer.score_performance)
        const importance = Number(answer.score_importance)

        if (!Number.isFinite(performance) || !Number.isFinite(importance)) {
          continue
        }

        const questionText = answer.questions?.question_text ?? 'Unknown question'

        rawRows.push({
          response_id: response.id,
          submitted_at: response.submitted_at,
          question_id: answer.question_id,
          question_text: questionText,
          performance,
          importance,
          reason: answer.reason ?? '',
        })

        const existing = aggregates.get(answer.question_id) ?? {
          questionText,
          performanceSum: 0,
          importanceSum: 0,
          count: 0,
        }

        aggregates.set(answer.question_id, {
          questionText,
          performanceSum: existing.performanceSum + performance,
          importanceSum: existing.importanceSum + importance,
          count: existing.count + 1,
        })
      }
    }

    const points: IpaPoint[] = []

    const averagePerformance =
      rawRows.length > 0
        ? rawRows.reduce((sum, row) => sum + row.performance, 0) / rawRows.length
        : 0
    const averageImportance =
      rawRows.length > 0
        ? rawRows.reduce((sum, row) => sum + row.importance, 0) / rawRows.length
        : 0

    for (const [questionId, aggregate] of aggregates.entries()) {
      const performance = aggregate.performanceSum / aggregate.count
      const importance = aggregate.importanceSum / aggregate.count
      const isHighImportance = importance >= averageImportance
      const isHighPerformance = performance >= averagePerformance

      let quadrant = 'Q3: Prioritas Rendah'
      if (isHighImportance && !isHighPerformance) quadrant = 'Q1: Prioritas Utama'
      if (isHighImportance && isHighPerformance) quadrant = 'Q2: Pertahankan Prestasi'
      if (!isHighImportance && isHighPerformance) quadrant = 'Q4: Berlebihan'

      points.push({
        question_id: questionId,
        question_text: aggregate.questionText,
        performance,
        importance,
        quadrant,
      })
    }

    return {
      ipaPoints: points,
      csvRows: rawRows,
      means: {
        performance: averagePerformance,
        importance: averageImportance,
      },
    }
  }, [responses])

  const quadrantMap = useMemo(
    () => new Map(ipaPoints.map((point) => [point.question_id, point.quadrant])),
    [ipaPoints],
  )

  async function toggleSurveyStatus() {
    if (!survey) {
      return
    }

    setUpdatingStatus(true)
    setError(null)

    const nextStatus = !survey.is_active

    const updateResult = await (supabase.from('surveys') as any)
      .update({ is_active: nextStatus })
      .eq('id', survey.id)
      .select('id, title, is_active, created_at')
      .single()

    if (updateResult.error || !updateResult.data) {
      setError(updateResult.error?.message ?? 'Gagal memperbarui status survei.')
      setUpdatingStatus(false)
      return
    }

    setSurvey(updateResult.data as SurveyRow)
    setUpdatingStatus(false)
  }

  function exportCsv() {
    const rows = csvRows.map((row) =>
      [
        row.response_id,
        row.submitted_at,
        row.question_text,
        row.performance,
        row.importance,
        row.reason,
        quadrantMap.get(row.question_id) ?? '-',
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(','),
    )

    const csv = [
      '\ufeffresponse_id,submitted_at,question_text,performance,importance,reason,quadrant',
      ...rows,
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `survei-lpdp-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f8fbff_0%,_#eef4fb_100%)] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(0,51,102,0.08)] sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#F97316]">
                Admin Command Center
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#003366] sm:text-4xl">
                IPA Analytics Dashboard
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Visualisasi ini merangkum matriks Importance-Performance Analysis dari jawaban
                dual_likert untuk membantu tim melihat prioritas perbaikan layanan.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Survey</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{survey?.title ?? '-'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Mean X</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {means.performance.toFixed(2)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Mean Y</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {means.importance.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
              {survey ? (
                <button
                  type="button"
                  onClick={toggleSurveyStatus}
                  disabled={updatingStatus}
                  className="inline-flex items-center justify-center rounded-full border border-[#003366] bg-[#003366] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0a447f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updatingStatus
                    ? 'Memperbarui...'
                    : survey.is_active
                      ? 'Tutup Survei'
                      : 'Buka Survei'}
                </button>
              ) : null}
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <p className="mt-8 text-sm text-red-600">{error}</p>
          ) : (
            <>
              <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">IPA Scatter Plot</h2>
                      <p className="mt-1 text-sm text-slate-600">
                        Kiri bawah ke kanan atas menggambarkan distribusi kuadran.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                      <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                        Q1 Prioritas Utama
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                        Q2 Pertahankan Prestasi
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                        Q3 Prioritas Rendah
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                        Q4 Berlebihan
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 h-[420px] w-full rounded-[1.5rem] bg-white p-3">
                    <ScatterPlot data={ipaPoints} meanPerformance={means.performance} meanImportance={means.importance} />
                  </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 sm:p-6">
                  <h2 className="text-lg font-semibold text-slate-900">Ringkasan Kuadran</h2>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    {['Q1: Prioritas Utama', 'Q2: Pertahankan Prestasi', 'Q3: Prioritas Rendah', 'Q4: Berlebihan'].map((label) => (
                      <div key={label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="mt-8 rounded-[2rem] border border-slate-200 bg-slate-50 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Raw Data</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Jawaban mentah untuk analisis lanjutan atau ekspor CSV.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={exportCsv}
                    className="inline-flex items-center justify-center rounded-full bg-[#F97316] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#ff8a3d]"
                  >
                    Export CSV
                  </button>
                </div>

                <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Response ID</th>
                          <th className="px-4 py-3">Submitted At</th>
                          <th className="px-4 py-3">Question</th>
                          <th className="px-4 py-3">Performance</th>
                          <th className="px-4 py-3">Importance</th>
                          <th className="px-4 py-3">Reason</th>
                          <th className="px-4 py-3">Quadrant</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {csvRows.map((row) => (
                          <tr key={`${row.response_id}-${row.question_text}`}>
                            <td className="px-4 py-3 text-slate-600">{row.response_id}</td>
                            <td className="px-4 py-3 text-slate-600">{row.submitted_at}</td>
                            <td className="px-4 py-3 font-medium text-slate-900">{row.question_text}</td>
                            <td className="px-4 py-3 text-slate-600">{row.performance}</td>
                            <td className="px-4 py-3 text-slate-600">{row.importance}</td>
                            <td className="px-4 py-3 text-slate-600">{row.reason || '-'}</td>
                            <td className="px-4 py-3 text-slate-600">
                              {quadrantMap.get(row.question_id) ?? '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </>
          )}
        </section>
      </div>
    </main>
  )
}

function ScatterPlot({
  data,
  meanPerformance,
  meanImportance,
}: {
  data: IpaPoint[]
  meanPerformance: number
  meanImportance: number
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" dataKey="performance" name="Performance" domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
        <YAxis type="number" dataKey="importance" name="Importance" domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
        <ReferenceLine x={meanPerformance} stroke="#F97316" strokeDasharray="4 4" />
        <ReferenceLine y={meanImportance} stroke="#003366" strokeDasharray="4 4" />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter data={data} fill="#F97316" />
      </ScatterChart>
    </ResponsiveContainer>
  )
}

export default AdminDashboard