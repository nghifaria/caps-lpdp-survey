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
  const [isSubmitted, setIsSubmitted] = useState(false)
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
        if (
          question.question_type !== 'short_text' &&
          question.question_type !== 'dropdown' &&
          question.question_type !== 'text'
        ) {
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

      if (question.question_type === 'dual_likert') {
        if (question.is_required && (!answer.scoreImportance || !answer.scorePerformance)) {
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
      } else {
        if (question.is_required) {
          let isEmpty = !answer.textValue.trim()
          if (question.question_type === 'checkbox' && !isEmpty) {
            try {
              const parsed = JSON.parse(answer.textValue)
              if (Array.isArray(parsed) && parsed.length === 0) {
                isEmpty = true
              }
            } catch {
              // Not valid JSON, fallback to text check
            }
          }

          if (isEmpty) {
            const isSelectable = [
              'dropdown',
              'checkbox',
              'multiple_choice',
              'true_false',
              'likert',
            ].includes(question.question_type)
            const verb = isSelectable ? 'dipilih' : 'diisi'
            setSubmitError(`Pertanyaan "${question.question_text}" wajib ${verb}.`)
            toast.error(`Pertanyaan "${question.question_text}" wajib ${verb}.`)
            setSubmitting(false)
            return
          }
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

      if (question.question_type !== 'dual_likert') {
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

    toast.success('Jawaban berhasil dikirim. Terima kasih.')
    if (draftKey) {
      localStorage.removeItem(draftKey)
    }
    hasDraftInteractionRef.current = false
    setAnswers({})
    setCurrentStep(0)
    setSubmitting(false)
    setIsSubmitted(true)
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

  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,_var(--color-broken-white)_0%,_var(--color-light-grey)_100%)] px-4 py-10 text-ash sm:px-6 lg:px-8 animate-fade-in">
        <div className="mx-auto max-w-2xl rounded-3xl border border-light-grey bg-white p-8 text-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-sm mb-6">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-navy">
            Survei Berhasil Dikirim!
          </h1>
          <p className="mt-4 text-sm leading-7 text-ash/80">
            Terima kasih atas partisipasi Anda. Jawaban Anda telah berhasil kami simpan dan akan digunakan sebagai bahan evaluasi serta perbaikan layanan beasiswa LPDP ke depan.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/', { replace: true })}
              className="inline-flex items-center justify-center rounded-xl bg-oren px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(189,91,44,0.28)] transition-all duration-300 hover:brightness-110 active:scale-95 cursor-pointer w-full sm:w-auto"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_var(--color-broken-white)_0%,_var(--color-light-grey)_100%)] px-4 py-10 text-ash sm:px-6 lg:px-8 animate-fade-in">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4">
          <button
            type="button"
            onClick={handleBackToHome}
            className="inline-flex items-center gap-2 rounded-xl border border-light-grey bg-white/80 px-4 py-2 text-sm font-semibold text-ash/80 transition-all hover:bg-white hover:text-ash hover:shadow-sm cursor-pointer"
          >
            <span aria-hidden="true">←</span>
            Kembali ke Beranda
          </button>
        </div>

        <div className="rounded-3xl border border-light-grey bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-oren">
            Survey Shell
          </p>

          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <p className="mt-6 text-sm text-red-600">{error}</p>
          ) : (
            <form className="mt-4" onSubmit={handleSubmit}>
              <h1 className="text-3xl font-semibold tracking-tight tracking-[-0.04em] text-navy sm:text-4xl mt-3">
                {survey?.title}
              </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span
                className={`rounded-xl px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                  isSurveyActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {isSurveyActive ? 'Survei Aktif' : 'Survei Ditutup'}
              </span>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-ash/80">
              Isi pertanyaan berikut untuk membantu kami membaca pengalaman layanan LPDP secara lebih akurat.
            </p>

            {totalQuestions > 0 ? (
              <div className="mt-6 rounded-2xl border border-light-grey bg-white p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
                <div className="mb-3 flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-[0.18em] text-ash/50">
                  <span>{`Pertanyaan ${currentStep + 1} dari ${totalQuestions}`}</span>
                  <span>{`${Math.round(progressPercentage)}%`}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-oren transition-all duration-300 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            ) : null}

            {!isSurveyActive ? (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Periode survei sudah ditutup. Jawaban baru tidak dapat dikirim.
              </div>
            ) : null}

            {submitError ? (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            <div className="mt-8 space-y-6">
              {currentQuestion ? (
                <div className="relative">
                  {isAutoFilledQuestion(currentQuestion.id) ? (
                    <div className="absolute right-0 top-0 flex flex-col items-end gap-2">
                      <span className="rounded-xl bg-navy/10 px-3 py-1 text-[11px] font-semibold text-navy">
                        ✓ Terisi otomatis dari profil Anda
                      </span>
                      <Link
                        to="/profile"
                        className="text-[11px] font-semibold text-navy underline decoration-oren decoration-2 underline-offset-4 transition hover:text-oren"
                      >
                        👉 Ada data keliru? Perbarui profil Anda di sini
                      </Link>
                    </div>
                  ) : null}
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">
                      {currentStep + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold tracking-tight text-ash">
                          {currentQuestion.question_text}
                        </h2>
                        {currentQuestion.is_required ? (
                          <span className="rounded-xl bg-oren/10 px-2.5 py-1 text-xs font-medium text-oren">
                            Wajib
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ash/40">
                        {currentQuestion.question_type}
                      </p>
                      {renderQuestionInput(currentQuestion)}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

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
                      className="inline-flex items-center justify-center rounded-xl border border-light-grey bg-transparent px-6 py-3 text-sm font-semibold text-ash/80 transition-colors hover:bg-slate-50 hover:text-ash disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                    >
                      Kembali
                    </button>
                  ) : null}
                </div>

                {currentStep < totalQuestions - 1 ? (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-xl bg-oren px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(189,91,44,0.28)] transition-all duration-300 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
                  >
                    {submitting ? 'Memproses...' : 'Selanjutnya'}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-xl bg-oren px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(189,91,44,0.28)] transition-all duration-300 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
                  >
                    {submitting ? 'Mengirim...' : 'Kirim Survei'}
                  </button>
                )}
              </div>
            ) : null}
          </form>
        )}
      </div>
    </div>
  </main>
  )
}

export default SurveyPage
