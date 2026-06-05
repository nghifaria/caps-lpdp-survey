import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import LoadingSpinner from '../../components/LoadingSpinner'
import QuestionRenderer from '../../components/questions/QuestionRenderer'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database'
import { toast } from 'sonner'

type SurveyRow = Database['public']['Tables']['surveys']['Row']
type QuestionRow = Database['public']['Tables']['questions']['Row']
type AnswerInsert = Database['public']['Tables']['answers']['Insert']
type ResponseInsert = Database['public']['Tables']['responses']['Insert']
type ProfileRow = Database['public']['Tables']['profiles']['Row']

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

type SurveyDraft = {
  answers: Record<string, AnswerDraft>
  currentStep: number
}

const emptyAnswerDraft: AnswerDraft = {
  textValue: '',
  scoreImportance: '',
  scorePerformance: '',
  reason: '',
}

function getBranchingLogic(question: QuestionRow) {
  const logic = question.branching_logic

  if (!logic || typeof logic !== 'object' || Array.isArray(logic)) {
    return null
  }

  return logic as BranchingLogic
}

function isSurveyDraft(value: unknown): value is SurveyDraft {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  const draft = value as Partial<SurveyDraft>

  return typeof draft.currentStep === 'number' && typeof draft.answers === 'object'
}

function normalizeQuestionText(value: string) {
  return value.toLowerCase()
}

function getProfileAutoFillValue(question: QuestionRow, profile: ProfileRow) {
  const questionText = normalizeQuestionText(question.question_text)

  if (questionText.includes('nama')) {
    return profile.full_name?.trim() ?? ''
  }

  if (questionText.includes('nik')) {
    return profile.nik?.trim() ?? ''
  }

  if (questionText.includes('lahir')) {
    return profile.date_of_birth?.trim() ?? ''
  }

  if (questionText.includes('provinsi')) {
    return profile.province?.trim() ?? ''
  }

  if (questionText.includes('universitas') || questionText.includes('perguruan tinggi')) {
    return profile.university?.trim() ?? ''
  }

  return ''
}

function hasAnswerContent(answer: AnswerDraft | undefined) {
  if (!answer) {
    return false
  }

  return Boolean(
    answer.textValue.trim() ||
      answer.scoreImportance ||
      answer.scorePerformance ||
      answer.reason.trim(),
  )
}

function SurveyPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const surveyParam = id ?? ''
  const draftKey = surveyParam ? `lpdp_survey_draft_${surveyParam}` : null
  const [survey, setSurvey] = useState<SurveyRow | null>(null)
  const [questions, setQuestions] = useState<QuestionRow[]>([])
  const [answers, setAnswers] = useState<Record<string, AnswerDraft>>({})
  const [awardeeProfile, setAwardeeProfile] = useState<ProfileRow | null>(null)
  const [autoFilledQuestionIds, setAutoFilledQuestionIds] = useState<Set<string>>(new Set())
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [draftHydrated, setDraftHydrated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const isSurveyActive = survey?.is_active ?? false
  const totalQuestions = questions.length
  const currentQuestion = questions[currentStep] ?? null
  const progressPercentage = totalQuestions > 0 ? ((currentStep + 1) / totalQuestions) * 100 : 0
  const hasDraftInteractionRef = useRef(false)
  const hasStarted = useMemo(() => Object.values(answers).some(hasAnswerContent), [answers])

  function handleBackToHome() {
    if (hasStarted) {
      const confirmed = window.confirm('Jawaban yang belum dikirim akan hilang. Kembali ke beranda?')

      if (!confirmed) {
        return
      }
    }

    navigate('/', { replace: true })
  }

  useEffect(() => {
    if (!draftKey) {
      return
    }

    const storedDraft = localStorage.getItem(draftKey)

    if (storedDraft) {
      try {
        const parsedDraft = JSON.parse(storedDraft) as unknown

        if (isSurveyDraft(parsedDraft)) {
          setAnswers(parsedDraft.answers ?? {})
          setCurrentStep(Math.max(parsedDraft.currentStep, 0))
          toast.info('Melanjutkan pengisian survei yang tersimpan...')
        }
      } catch {
        localStorage.removeItem(draftKey)
      }
    }

    setDraftHydrated(true)
  }, [draftKey])

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      const userResult = await supabase.auth.getUser()

      if (cancelled) {
        return
      }

      const userId = userResult.data.user?.id

      if (!userId) {
        setAwardeeProfile(null)
        return
      }

      const profileResult = await supabase
        .from('profiles')
        .select('id, full_name, nik, date_of_birth, province, university, role, updated_at')
        .eq('id', userId)
        .maybeSingle()

      if (cancelled) {
        return
      }

      if (profileResult.error) {
        setAwardeeProfile(null)
        return
      }

      setAwardeeProfile((profileResult.data as ProfileRow | null) ?? null)
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!draftHydrated || !awardeeProfile || questions.length === 0) {
      return
    }

    const nextAutoFilledIds = new Set<string>()

    setAnswers((currentAnswers) => {
      let hasChanges = false
      const nextAnswers = { ...currentAnswers }

      for (const question of questions) {
        if (question.question_type !== 'short_text' && question.question_type !== 'dropdown') {
          continue
        }

        const profileValue = getProfileAutoFillValue(question, awardeeProfile)

        if (!profileValue) {
          continue
        }

        const existingAnswer = currentAnswers[question.id]

        if (hasAnswerContent(existingAnswer)) {
          continue
        }

        nextAnswers[question.id] = {
          ...(existingAnswer ?? emptyAnswerDraft),
          textValue: profileValue,
        }

        nextAutoFilledIds.add(question.id)
        hasChanges = true
      }

      if (!hasChanges) {
        return currentAnswers
      }

      return nextAnswers
    })

    if (nextAutoFilledIds.size > 0) {
      setAutoFilledQuestionIds((currentIds) => {
        const mergedIds = new Set(currentIds)

        nextAutoFilledIds.forEach((questionId) => {
          mergedIds.add(questionId)
        })

        return mergedIds
      })
    }
  }, [awardeeProfile, draftHydrated, questions])

  useEffect(() => {
    if (questions.length > 0 && currentStep > questions.length - 1) {
      setCurrentStep(questions.length - 1)
    }
  }, [currentStep, questions.length])

  useEffect(() => {
    if (!draftHydrated || !draftKey || !hasDraftInteractionRef.current) {
      return
    }

    const draft: SurveyDraft = {
      answers,
      currentStep,
    }

    localStorage.setItem(draftKey, JSON.stringify(draft))
  }, [answers, currentStep, draftHydrated, draftKey])

  function updateAnswer(questionId: string, patch: Partial<AnswerDraft>) {
    hasDraftInteractionRef.current = true

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

  function isAutoFilledQuestion(questionId: string) {
    return autoFilledQuestionIds.has(questionId)
  }

  function renderQuestionInput(question: QuestionRow) {
    const answer = answers[question.id] ?? emptyAnswerDraft
    const autoFilled = isAutoFilledQuestion(question.id)

    const isDual = question.question_type === 'dual_likert'
    const val = isDual ? answer : answer.textValue
    const onChange = isDual
      ? (patch: Partial<AnswerDraft>) => updateAnswer(question.id, patch)
      : (textVal: string) => updateAnswer(question.id, { textValue: textVal })

    return (
      <QuestionRenderer
        question={question}
        value={val}
        onChange={onChange}
        preview={!isSurveyActive || autoFilled}
      />
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!currentQuestion) {
      return
    }

    if (currentStep < totalQuestions - 1) {
      hasDraftInteractionRef.current = true
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
    if (draftKey) {
      localStorage.removeItem(draftKey)
    }
    hasDraftInteractionRef.current = false
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

      const surveyResult = await supabase
        .from('surveys')
        .select('id, title, is_active, created_at')
        .eq('id', surveyParam)
        .maybeSingle()

      if (surveyResult.error) {
        if (!cancelled) {
          setError(surveyResult.error.message)
          setLoading(false)
        }
        return
      }

      const resolvedSurvey = (surveyResult.data as SurveyRow | null) ?? null

      if (!resolvedSurvey) {
        if (!cancelled) {
          setError('Survei tidak ditemukan.')
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
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-gray-100 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] sm:p-8">
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
              className="inline-flex items-center gap-2 rounded-full bg-transparent px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-gray-100 hover:text-slate-900 cursor-pointer"
            >
              <span aria-hidden="true">←</span>
              Kembali ke Beranda
            </button>

            <h1 className="text-3xl font-semibold tracking-tight tracking-[-0.04em] text-[#003366] sm:text-4xl mt-3">
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
              <div className="mt-6 rounded-2xl border border-gray-100 bg-slate-50 p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
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

            <section className="mt-8 space-y-6 rounded-[2rem] border border-gray-100 bg-slate-50 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              {currentQuestion ? (
                <article className="relative transform-gpu rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
                  {isAutoFilledQuestion(currentQuestion.id) ? (
                    <div className="absolute right-5 top-5 flex flex-col items-end gap-2">
                      <span className="rounded-full bg-[#003366]/10 px-3 py-1 text-[11px] font-semibold text-[#003366]">
                        ✓ Terisi otomatis dari profil Anda
                      </span>
                      <Link
                        to="/profile"
                        className="text-[11px] font-semibold text-[#003366] underline decoration-[#F97316] decoration-2 underline-offset-4 transition hover:text-[#F97316]"
                      >
                        👉 Ada data keliru? Perbarui profil Anda di sini
                      </Link>
                    </div>
                  ) : null}
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#003366] text-xs font-semibold text-white">
                      {currentStep + 1}
                    </div>
                    <div className="min-w-0 flex-1 pr-40">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold tracking-tight text-slate-900">
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
                      onClick={() => {
                        hasDraftInteractionRef.current = true
                        setCurrentStep((step) => Math.max(step - 1, 0))
                      }}
                      disabled={submitting}
                      className="inline-flex items-center justify-center rounded-full bg-transparent px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-gray-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                    >
                      Kembali
                    </button>
                  ) : null}
                </div>

                {currentStep < totalQuestions - 1 ? (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-full bg-[#F97316] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(249,115,22,0.35)] transition-all duration-300 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
                  >
                    {submitting ? 'Memproses...' : 'Selanjutnya'}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-full bg-[#F97316] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(249,115,22,0.35)] transition-all duration-300 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
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
