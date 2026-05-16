import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { toast } from 'sonner'

type SurveyRow = Database['public']['Tables']['surveys']['Row']
type QuestionRow = Database['public']['Tables']['questions']['Row']
type AnswerInsert = Database['public']['Tables']['answers']['Insert']
type ResponseInsert = Database['public']['Tables']['responses']['Insert']

type AnswerDraft = {
  textValue: string
  scoreImportance: string
  scorePerformance: string
  reason: string
}

type BranchingLogic = {
  show_reason_if?: {
    field?: string
    operator?: string
    value?: number
    target?: string
  }
}

const surveyTitle = 'Survei Kepuasan Layanan LPDP 2026'
const emptyAnswerDraft: AnswerDraft = {
  textValue: '',
  scoreImportance: '',
  scorePerformance: '',
  reason: '',
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

function getBranchingLogic(question: QuestionRow) {
  const logic = question.branching_logic

  if (!logic || typeof logic !== 'object' || Array.isArray(logic)) {
    return null
  }

  return logic as BranchingLogic
}

function getDropdownOptions(question: QuestionRow) {
  if (!Array.isArray(question.options)) {
    return []
  }

  return question.options.filter((option): option is string => typeof option === 'string')
}

function SurveyPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const surveyParam = id ?? ''
  const [survey, setSurvey] = useState<SurveyRow | null>(null)
  const [questions, setQuestions] = useState<QuestionRow[]>([])
  const [answers, setAnswers] = useState<Record<string, AnswerDraft>>({})
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const isSurveyActive = survey?.is_active ?? false
  const totalQuestions = questions.length
  const currentQuestion = questions[currentStep] ?? null
  const progressPercentage = totalQuestions > 0 ? ((currentStep + 1) / totalQuestions) * 100 : 0
  const hasStarted = useMemo(
    () =>
      Object.values(answers).some(
        (answer) =>
          Boolean(answer.textValue.trim()) ||
          Boolean(answer.scoreImportance) ||
          Boolean(answer.scorePerformance) ||
          Boolean(answer.reason.trim()),
      ),
    [answers],
  )

  function handleBackToHome() {
    if (hasStarted) {
      const confirmed = window.confirm('Jawaban yang belum dikirim akan hilang. Kembali ke beranda?')

      if (!confirmed) {
        return
      }
    }

    navigate('/', { replace: true })
  }

  function updateAnswer(questionId: string, patch: Partial<AnswerDraft>) {
    setAnswers((current) => {
      const existing = current[questionId] ?? emptyAnswerDraft

      return {
        ...current,
        [questionId]: {
          ...existing,
          ...patch,
        },
      }
    })
  }

  function shouldShowReason(question: QuestionRow, answer: AnswerDraft) {
    if (question.question_type !== 'dual_likert') {
      return false
    }

    const logic = getBranchingLogic(question)
    const rule = logic?.show_reason_if

    if (
      rule?.field !== 'score_performance' ||
      rule.operator !== '<' ||
      rule.target !== 'reason' ||
      typeof rule.value !== 'number'
    ) {
      return false
    }

    const performanceScore = Number(answer.scorePerformance)

    return Number.isFinite(performanceScore) && performanceScore < rule.value
  }

  function renderQuestionInput(question: QuestionRow) {
    const answer = answers[question.id] ?? emptyAnswerDraft

    if (question.question_type === 'short_text') {
      return (
        <input
          type="text"
          value={answer.textValue}
          onChange={(event) => updateAnswer(question.id, { textValue: event.target.value })}
          disabled={!isSurveyActive}
          required={question.is_required}
          placeholder="Tulis jawaban di sini"
          className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/10 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      )
    }

    if (question.question_type === 'dropdown') {
      const options = getDropdownOptions(question)

      return (
        <select
          value={answer.textValue}
          onChange={(event) => updateAnswer(question.id, { textValue: event.target.value })}
          disabled={!isSurveyActive}
          required={question.is_required}
          className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/10 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          <option value="">Pilih salah satu provinsi</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )
    }

    if (question.question_type === 'dual_likert') {
      const showReason = shouldShowReason(question, answer)
      const likertValues = [1, 2, 3, 4, 5]

      return (
        <div className="mt-5 space-y-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="grid grid-cols-[1fr_repeat(5,minmax(0,1fr))] gap-px bg-slate-200 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <div className="bg-slate-50 px-4 py-3">Dimensi</div>
              {likertValues.map((value) => (
                <div key={value} className="bg-slate-50 px-2 py-3 text-center">
                  {value}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[1fr_repeat(5,minmax(0,1fr))] gap-px bg-slate-200">
              <div className="bg-white px-4 py-4 text-sm font-medium text-slate-900">
                Kepentingan
              </div>
              {likertValues.map((value) => (
                <label
                  key={`importance-${value}`}
                  className="flex items-center justify-center bg-white px-2 py-4"
                >
                  <input
                    type="radio"
                    name={`importance-${question.id}`}
                    value={value}
                    checked={answer.scoreImportance === String(value)}
                    onChange={() =>
                      updateAnswer(question.id, { scoreImportance: String(value) })
                    }
                    disabled={!isSurveyActive}
                    required={question.is_required && value === 1}
                    className="h-4 w-4 border-slate-300 text-[#F97316] focus:ring-[#F97316] disabled:cursor-not-allowed"
                  />
                </label>
              ))}
            </div>

            <div className="grid grid-cols-[1fr_repeat(5,minmax(0,1fr))] gap-px bg-slate-200">
              <div className="bg-white px-4 py-4 text-sm font-medium text-slate-900">
                Kepuasan
              </div>
              {likertValues.map((value) => (
                <label
                  key={`performance-${value}`}
                  className="flex items-center justify-center bg-white px-2 py-4"
                >
                  <input
                    type="radio"
                    name={`performance-${question.id}`}
                    value={value}
                    checked={answer.scorePerformance === String(value)}
                    onChange={() =>
                      updateAnswer(question.id, { scorePerformance: String(value) })
                    }
                    disabled={!isSurveyActive}
                    required={question.is_required && value === 1}
                    className="h-4 w-4 border-slate-300 text-[#F97316] focus:ring-[#F97316] disabled:cursor-not-allowed"
                  />
                </label>
              ))}
            </div>
          </div>

          {showReason ? (
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor={`reason-${question.id}`}>
                Alasan
              </label>
              <textarea
                id={`reason-${question.id}`}
                value={answer.reason}
                onChange={(event) => updateAnswer(question.id, { reason: event.target.value })}
                disabled={!isSurveyActive}
                required
                rows={4}
                placeholder="Jelaskan singkat alasan skor kepuasan di bawah 3"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/10 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>
          ) : null}
        </div>
      )
    }

    return null
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!currentQuestion) {
      return
    }

    if (currentStep < totalQuestions - 1) {
      setCurrentStep((step) => Math.min(step + 1, totalQuestions - 1))
      return
    }

    if (!survey) {
      return
    }

    if (!isSurveyActive) {
      setSubmitError('Survei sudah ditutup dan tidak dapat menerima jawaban baru.')
      toast.error('Survei sudah ditutup dan tidak dapat menerima jawaban baru.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    setSuccessMessage(null)

    for (const question of questions) {
      const answer = answers[question.id] ?? emptyAnswerDraft

      if (question.question_type === 'short_text' && !answer.textValue.trim()) {
        setSubmitError(`Pertanyaan "${question.question_text}" wajib diisi.`)
        toast.error(`Pertanyaan "${question.question_text}" wajib diisi.`)
        setSubmitting(false)
        return
      }

      if (question.question_type === 'dropdown' && !answer.textValue.trim()) {
        setSubmitError(`Pertanyaan "${question.question_text}" wajib dipilih.`)
        toast.error(`Pertanyaan "${question.question_text}" wajib dipilih.`)
        setSubmitting(false)
        return
      }

      if (question.question_type === 'dual_likert') {
        if (!answer.scoreImportance || !answer.scorePerformance) {
          setSubmitError(`Pertanyaan "${question.question_text}" wajib diisi lengkap.`)
          toast.error(`Pertanyaan "${question.question_text}" wajib diisi lengkap.`)
          setSubmitting(false)
          return
        }

        if (shouldShowReason(question, answer) && !answer.reason.trim()) {
          setSubmitError(`Alasan wajib diisi untuk pertanyaan "${question.question_text}".`)
          toast.error(`Alasan wajib diisi untuk pertanyaan "${question.question_text}".`)
          setSubmitting(false)
          return
        }
      }
    }

    const responsePayload: ResponseInsert = {
      survey_id: survey.id,
    }

    const responseResult = await (supabase
      .from('responses') as any)
      .insert(responsePayload)
      .select('id')
      .single()

    if (responseResult.error || !responseResult.data) {
      setSubmitError(responseResult.error?.message ?? 'Gagal menyimpan respons.')
      toast.error(responseResult.error?.message ?? 'Gagal menyimpan respons.')
      setSubmitting(false)
      return
    }

    const answerPayloads: AnswerInsert[] = questions.map((question) => {
      const answer = answers[question.id] ?? emptyAnswerDraft

      if (question.question_type === 'short_text' || question.question_type === 'dropdown') {
        return {
          response_id: responseResult.data.id,
          question_id: question.id,
          text_value: answer.textValue.trim(),
          score_performance: null,
          score_importance: null,
          reason: null,
        }
      }

      const reason = shouldShowReason(question, answer) ? answer.reason.trim() : null

      return {
        response_id: responseResult.data.id,
        question_id: question.id,
        text_value: null,
        score_performance: Number(answer.scorePerformance),
        score_importance: Number(answer.scoreImportance),
        reason: reason || null,
      }
    })

    const answersResult = await (supabase.from('answers') as any).insert(answerPayloads)

    if (answersResult.error) {
      setSubmitError(answersResult.error.message)
      toast.error(answersResult.error.message)
      setSubmitting(false)
      return
    }

    setSuccessMessage('Jawaban berhasil dikirim. Terima kasih.')
    toast.success('Jawaban berhasil dikirim. Terima kasih.')
    setAnswers({})
    setCurrentStep(0)
    setSubmitting(false)
  }

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
          setCurrentStep(0)
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
          <LoadingSpinner />
        ) : error ? (
          <p className="mt-6 text-sm text-red-600">{error}</p>
        ) : (
          <form className="mt-4" onSubmit={handleSubmit}>
            <button
              type="button"
              onClick={handleBackToHome}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#003366] transition hover:text-[#F97316]"
            >
              <span aria-hidden="true">←</span>
              Kembali ke Beranda
            </button>

            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#003366] sm:text-4xl">
              {survey?.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                  isSurveyActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {isSurveyActive ? 'Survei Aktif' : 'Survei Ditutup'}
              </span>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
              Isi pertanyaan berikut untuk membantu kami membaca pengalaman layanan LPDP secara lebih akurat.
            </p>

            {totalQuestions > 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  <span>{`Pertanyaan ${currentStep + 1} dari ${totalQuestions}`}</span>
                  <span>{`${Math.round(progressPercentage)}%`}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[#F97316] transition-all duration-300 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            ) : null}

            {!isSurveyActive ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Periode survei sudah ditutup. Jawaban baru tidak dapat dikirim.
              </div>
            ) : null}

            {submitError ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            <section className="mt-8 space-y-6 rounded-[2rem] border border-slate-200 bg-slate-50 p-5 sm:p-6">
              {currentQuestion ? (
                <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#003366] text-xs font-semibold text-white">
                      {currentStep + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-slate-900">
                          {currentQuestion.question_text}
                        </h2>
                        {currentQuestion.is_required ? (
                          <span className="rounded-full bg-[#F97316]/10 px-2.5 py-1 text-xs font-medium text-[#F97316]">
                            Wajib
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                        {currentQuestion.question_type}
                      </p>
                      {renderQuestionInput(currentQuestion)}
                    </div>
                  </div>
                </article>
              ) : null}
            </section>

            {isSurveyActive ? (
              <div className="mt-8 flex items-center justify-between gap-3">
                <div>
                  {currentStep > 0 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}
                      disabled={submitting}
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Kembali
                    </button>
                  ) : null}
                </div>

                {currentStep < totalQuestions - 1 ? (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-full bg-[#F97316] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(249,115,22,0.35)] transition hover:-translate-y-0.5 hover:bg-[#ff8a3d] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {submitting ? 'Memproses...' : 'Selanjutnya'}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-full bg-[#F97316] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(249,115,22,0.35)] transition hover:-translate-y-0.5 hover:bg-[#ff8a3d] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {submitting ? 'Mengirim...' : 'Kirim Survei'}
                  </button>
                )}
              </div>
            ) : null}
          </form>
        )}
      </div>
    </main>
  )
}

export default SurveyPage