import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
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
type SectionRow = Database['public']['Tables']['sections']['Row']

type SectionWithQuestions = SectionRow & {
  questions: QuestionRow[]
}

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
  const location = useLocation()
  const isPreview = new URLSearchParams(location.search).get('preview') === 'true'
  const [survey, setSurvey] = useState<SurveyRow | null>(null)
  const [sections, setSections] = useState<SectionWithQuestions[]>([])
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
  const totalSteps = sections.length
  const currentSection = sections[currentStep] ?? null
  const progressPercentage = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0
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

    if (!currentSection) {
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    setSuccessMessage(null)

    // Validasi HANYA untuk section ini sebelum lanjut
    for (const question of currentSection.questions) {
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

    if (currentStep < totalSteps - 1) {
      hasDraftInteractionRef.current = true
      setCurrentStep((step) => Math.min(step + 1, totalSteps - 1))
      setSubmitting(false)
      window.scrollTo(0, 0)
      return
    }

    if (!survey) {
      setSubmitting(false)
      return
    }

    if (isPreview) {
      toast.success('Simulasi berhasil dikirim! Karena ini mode preview, data tidak disimpan.')
      setSubmitting(false)
      setIsSubmitted(true)
      return
    }

    if (!isSurveyActive) {
      setSubmitError('Survei sudah ditutup dan tidak dapat menerima jawaban baru.')
      toast.error('Survei sudah ditutup dan tidak dapat menerima jawaban baru.')
      setSubmitting(false)
      return
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
        .select('id, title, guideline, is_active, created_at')
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

      const sectionsResult = await supabase
        .from('sections')
        .select('id, survey_id, title, description, order_index, created_at')
        .eq('survey_id', resolvedSurveyId)
        .order('order_index', { ascending: true })

      const questionsResult = await supabase
        .from('questions')
        .select('id, survey_id, section_id, question_text, description, question_type, options, is_required, branching_logic, order_index')
        .eq('survey_id', resolvedSurveyId)
        .order('order_index', { ascending: true })

      if (!cancelled) {
        if (questionsResult.error) {
          setError(questionsResult.error.message)
        } else {
          setSurvey(resolvedSurvey)
          
          const rawSections = (sectionsResult.data ?? []) as SectionRow[]
          const rawQuestions = (questionsResult.data ?? []) as QuestionRow[]
          
          const merged: SectionWithQuestions[] = rawSections.map((sec) => ({
            ...sec,
            questions: rawQuestions.filter((q) => q.section_id === sec.id),
          }))
          
          const orphans = rawQuestions.filter((q) => !q.section_id)
          if (orphans.length > 0) {
            merged.push({
              id: '__orphan__',
              survey_id: resolvedSurveyId,
              title: 'Umum',
              description: '',
              order_index: 999,
              created_at: '',
              questions: orphans,
            })
          }

          setSections(merged)
          setQuestions(rawQuestions)
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
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes springEntrance {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          50% { transform: translateY(-5px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-spring-up {
          animation: springEntrance 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          opacity: 0;
        }
        .micro-physics {
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .micro-physics:hover {
          transform: scale(1.01) translateY(-4px);
        }
      `}} />
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

        <div className="rounded-3xl border border-light-grey bg-[#fffcf4] p-6 shadow-[0_10px_40px_-10px_rgba(43,43,43,0.08)] sm:p-8 animate-spring-up">
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

            {survey?.guideline && (
              <div className="mt-6 rounded-2xl border border-sky-100 bg-sky-50/50 p-5 text-sm text-ash/90 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.02)]">
                <div className="flex items-start gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 text-xs font-bold mt-0.5">
                    i
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-navy mb-1">Petunjuk Pengisian Survei</p>
                    <p className="leading-relaxed whitespace-pre-wrap text-ash/80">{survey.guideline}</p>
                  </div>
                </div>
              </div>
            )}

            {totalSteps > 0 ? (
              <div className="mt-6 rounded-2xl border border-light-grey bg-[#fffcf4] p-4 shadow-[0_4px_20px_-4px_rgba(43,43,43,0.03)]">
                <div className="mb-3 flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-[0.18em] text-ash/50">
                  <span>{`Bagian ${currentStep + 1} dari ${totalSteps}`}</span>
                  <span>{`${Math.round(progressPercentage)}%`}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-light-grey/50">
                  <div
                    className="h-full rounded-full bg-[#d4af37] transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            ) : null}

            {!isSurveyActive && !isPreview ? (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Periode survei sudah ditutup. Jawaban baru tidak dapat dikirim.
              </div>
            ) : null}

            {isPreview && (
              <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 font-medium">
                Preview Mode - Simulasi tampilan responden. Data tidak akan disimpan.
              </div>
            )}

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

            <div className="mt-8 space-y-8">
              {currentSection ? (
                <>
                  <div className="border-b border-light-grey pb-4">
                    <h2 className="text-xl font-bold tracking-tight text-ash">
                      {currentSection.title}
                    </h2>
                    {currentSection.description && (
                      <p className="mt-2 text-sm text-ash/70">{currentSection.description}</p>
                    )}
                  </div>

                  <div className="space-y-12">
                    {currentSection.questions.map((question, qIdx) => {
                      const questionsBefore = sections
                        .slice(0, currentStep)
                        .reduce((sum, s) => sum + s.questions.length, 0)
                      const globalIndex = questionsBefore + qIdx + 1
                      return (
                        <div key={question.id} className="relative">
                          {isAutoFilledQuestion(question.id) ? (
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
                              {globalIndex}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-semibold tracking-tight text-ash">
                                  {question.question_text}
                                </h3>
                                {question.is_required ? (
                                  <span className="rounded-xl bg-oren/10 px-2.5 py-1 text-xs font-medium text-oren">
                                    Wajib
                                  </span>
                                ) : null}
                              </div>
                              {question.description && (
                                <p className="mt-1 text-xs text-ash/60 leading-normal">
                                  {question.description}
                                </p>
                              )}
                              <div className="mb-4" />
                              {renderQuestionInput(question)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>

            {isSurveyActive || isPreview ? (
              <div className="mt-8 flex items-center justify-between gap-3">
                <div>
                  {currentStep > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        hasDraftInteractionRef.current = true
                        setCurrentStep((step) => Math.max(step - 1, 0))
                        window.scrollTo(0, 0)
                      }}
                      disabled={submitting}
                      className="inline-flex items-center justify-center rounded-xl border border-light-grey bg-transparent px-6 py-3 text-sm font-semibold text-ash/80 transition-transform duration-200 hover:bg-slate-50 hover:text-ash active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer micro-physics"
                    >
                      Kembali
                    </button>
                  ) : null}
                </div>

                {currentStep < totalSteps - 1 ? (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-xl bg-oren px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(189,91,44,0.28)] transition-transform duration-200 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer micro-physics"
                  >
                    {submitting ? 'Memproses...' : 'Selanjutnya'}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-xl bg-oren px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(189,91,44,0.28)] transition-transform duration-200 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer micro-physics"
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
