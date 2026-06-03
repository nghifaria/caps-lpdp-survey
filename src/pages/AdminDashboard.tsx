import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'
import { toast } from 'sonner'

type SurveyRow = Database['public']['Tables']['surveys']['Row']
type ResponseRow = Database['public']['Tables']['responses']['Row']
type AnswerRow = Database['public']['Tables']['answers']['Row']
type QuestionRow = Database['public']['Tables']['questions']['Row']
type UserRole = Database['public']['Tables']['profiles']['Row']['role']

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

type CriticalFeedbackItem = {
  response_id: string
  question_text: string
  performance: number
  reason: string
}

type ExecutiveKpi = {
  label: string
  value: string
  tone: 'default' | 'warning' | 'accent'
}

type ParticipationTrendPoint = {
  date: string
  count: number
}

type ProvinceSlice = {
  name: string
  value: number
}

const provinceColors = ['#003366', '#F26522', '#0F9D58', '#8B5CF6', '#D97706', '#0EA5E9']

type QuadrantInsight = {
  label: string
  title: string
  tone: 'warning' | 'success' | 'muted' | 'accent'
  questions: string[]
}

type AdminUserRow = {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole
  updated_at: string
}

type SurveyQuestionFormType = 'dual_likert' | 'text'

const provinceOptions = ['Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur']

type AdminRpcClient = {
  rpc(
    functionName: 'list_profiles_for_admin',
  ): Promise<{ data: AdminUserRow[] | null; error: { message: string } | null }>
  rpc(
    functionName: 'set_user_role',
    args: { target_user_id: string; next_role: UserRole },
  ): Promise<{ error: { message: string } | null }>
  rpc(
    functionName: 'set_survey_status',
    args: { survey_id: string; next_status: boolean },
  ): Promise<{ error: { message: string } | null }>
}

const adminRpc = supabase as unknown as AdminRpcClient

function AdminDashboard() {
  const navigate = useNavigate()
  const [survey, setSurvey] = useState<SurveyRow | null>(null)
  const [surveys, setSurveys] = useState<SurveyRow[]>([])
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)
  const [responses, setResponses] = useState<ResponseWithAnswers[]>([])
  const [selectedProvince, setSelectedProvince] = useState('all')
  const [activeTab, setActiveTab] = useState<'analytics' | 'critical-feedback' | 'users' | 'manage-surveys'>('analytics')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null)
  const [surveysLoading, setSurveysLoading] = useState(true)
  const [surveysError, setSurveysError] = useState<string | null>(null)
  const [newSurveyTitle, setNewSurveyTitle] = useState('')
  const [creatingSurvey, setCreatingSurvey] = useState(false)
  const [deletingSurveyId, setDeletingSurveyId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<QuestionRow[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [questionsError, setQuestionsError] = useState<string | null>(null)
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionType, setNewQuestionType] = useState<SurveyQuestionFormType>('dual_likert')
  const [newQuestionRequired, setNewQuestionRequired] = useState(true)
  const [creatingQuestion, setCreatingQuestion] = useState(false)
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null)

  async function loadSurveys() {
    setSurveysLoading(true)
    setSurveysError(null)
    const { data, error: surveyListError } = await supabase
      .from('surveys')
      .select('id, title, is_active, created_at')
      .order('created_at', { ascending: false })

    if (surveyListError) {
      setSurveysError(surveyListError.message)
      setSurveys([])
    } else {
      setSurveys((data ?? []) as SurveyRow[])
    }

    setSurveysLoading(false)
  }

  async function loadQuestions(surveyId: string) {
    setQuestionsLoading(true)
    setQuestionsError(null)

    const { data, error: questionListError } = await supabase
      .from('questions')
      .select('id, survey_id, question_text, question_type, options, is_required, branching_logic')
      .eq('survey_id', surveyId)
      .order('question_text', { ascending: true })

    if (questionListError) {
      setQuestionsError(questionListError.message)
      setQuestions([])
    } else {
      setQuestions((data ?? []) as QuestionRow[])
    }

    setQuestionsLoading(false)
  }

  useEffect(() => {
    let cancelled = false

    async function loadUsers() {
      setUsersLoading(true)
      setUsersError(null)

      const userListResult = await adminRpc.rpc('list_profiles_for_admin')

      if (cancelled) {
        return
      }

      if (userListResult.error) {
        setUsersError(userListResult.error.message)
        setUsers([])
      } else {
        setUsers((userListResult.data ?? []) as AdminUserRow[])
      }

      setUsersLoading(false)
    }

    async function loadDashboard() {
      setLoading(true)
      setError(null)

      const { data: authData, error: authError } = await supabase.auth.getUser()
      const user = authData.user

      if (authError || !user) {
        if (!cancelled) {
          setError(authError?.message ?? 'User belum login.')
          setLoading(false)
          setUsersLoading(false)
        }
        return
      }

      if (!cancelled) {
        setCurrentUserId(user.id)
      }

      const { data: profileData, error: profileError } = (await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()) as {
        data: { role: UserRole } | null
        error: { message: string } | null
      }

      if (profileError) {
        if (!cancelled) {
          setError(profileError.message)
          setLoading(false)
          setUsersLoading(false)
        }
        return
      }

      if (profileData?.role !== 'admin') {
        toast.error('Akses admin diperlukan.')
        navigate('/', { replace: true })
        return
      }

      void loadUsers()
      void loadSurveys()

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
  }, [navigate])

  const filteredResponses = useMemo(() => {
    if (selectedProvince === 'all') {
      return responses
    }

    return responses.filter((response) => {
      const provinceAnswer = response.answers?.find(
        (answer) => answer.questions?.question_text === 'Asal Provinsi',
      )

      return provinceAnswer?.text_value === selectedProvince
    })
  }, [responses, selectedProvince])

  const { ipaPoints, csvRows, means } = useMemo(() => {
    const rawRows: CsvRow[] = []
    const aggregates = new Map<
      string,
      { questionText: string; performanceSum: number; importanceSum: number; count: number }
    >()

    for (const response of filteredResponses) {
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

    const questionAverages = Array.from(aggregates.entries()).map(([questionId, aggregate]) => ({
      questionId,
      questionText: aggregate.questionText,
      performance: aggregate.performanceSum / aggregate.count,
      importance: aggregate.importanceSum / aggregate.count,
    }))

    const useFallbackCrosshair = questionAverages.length === 1
    const averagePerformance = useFallbackCrosshair
      ? 3
      : questionAverages.length > 0
        ? questionAverages.reduce((sum, row) => sum + row.performance, 0) / questionAverages.length
        : 0
    const averageImportance = useFallbackCrosshair
      ? 3
      : questionAverages.length > 0
        ? questionAverages.reduce((sum, row) => sum + row.importance, 0) / questionAverages.length
        : 0

    const points: IpaPoint[] = questionAverages.map((question) => {
      const isHighImportance = question.importance >= averageImportance
      const isHighPerformance = question.performance >= averagePerformance

      let quadrant = 'Q3: Prioritas Rendah'
      if (isHighImportance && !isHighPerformance) quadrant = 'Q1: Prioritas Utama'
      if (isHighImportance && isHighPerformance) quadrant = 'Q2: Pertahankan Prestasi'
      if (!isHighImportance && isHighPerformance) quadrant = 'Q4: Berlebihan'

      return {
        question_id: question.questionId,
        question_text: question.questionText,
        performance: question.performance,
        importance: question.importance,
        quadrant,
      }
    })

    return {
      ipaPoints: points,
      csvRows: rawRows,
      means: {
        performance: averagePerformance,
        importance: averageImportance,
      },
    }
  }, [filteredResponses])

  const quadrantMap = useMemo(
    () => new Map(ipaPoints.map((point) => [point.question_id, point.quadrant])),
    [ipaPoints],
  )

  const criticalFeedback = useMemo(() => {
    const feedback: CriticalFeedbackItem[] = []

    for (const response of filteredResponses) {
      for (const answer of response.answers ?? []) {
        if (answer.questions?.question_type !== 'dual_likert') {
          continue
        }

        const performance = Number(answer.score_performance)
        const reason = answer.reason?.trim() ?? ''

        if (!Number.isFinite(performance) || performance >= 3 || !reason) {
          continue
        }

        feedback.push({
          response_id: response.id,
          question_text: answer.questions?.question_text ?? 'Unknown question',
          performance,
          reason,
        })
      }
    }

    return feedback
  }, [filteredResponses])

  const participationTrend = useMemo(() => {
    const counts = new Map<string, number>()

    for (const response of filteredResponses) {
      const dateKey = new Date(response.submitted_at).toISOString().slice(0, 10)
      counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1)
    }

    return Array.from(counts.entries())
      .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
      .map(([date, count]) => ({ date, count })) satisfies ParticipationTrendPoint[]
  }, [filteredResponses])

  const provinceDistribution = useMemo(() => {
    const counts = new Map<string, number>()

    for (const response of filteredResponses) {
      const provinceAnswer = response.answers?.find(
        (answer) => answer.questions?.question_text === 'Asal Provinsi',
      )

      const province = provinceAnswer?.text_value?.trim()

      if (!province) {
        continue
      }

      counts.set(province, (counts.get(province) ?? 0) + 1)
    }

    return Array.from(counts.entries())
      .sort(([leftProvince], [rightProvince]) => leftProvince.localeCompare(rightProvince))
      .map(([name, value]) => ({ name, value })) satisfies ProvinceSlice[]
  }, [filteredResponses])

  const executiveKpis = useMemo(() => {
    const performanceScores: number[] = []

    for (const response of filteredResponses) {
      for (const answer of response.answers ?? []) {
        if (answer.questions?.question_type !== 'dual_likert') {
          continue
        }

        const performance = Number(answer.score_performance)

        if (Number.isFinite(performance)) {
          performanceScores.push(performance)
        }
      }
    }

    const csi =
      performanceScores.length > 0
        ? performanceScores.reduce((sum, score) => sum + score, 0) / performanceScores.length
        : 0

    return [
      {
        label: 'Total Responden Filtered',
        value: filteredResponses.length.toString(),
        tone: 'default',
      },
      {
        label: 'Customer Satisfaction Index (CSI)',
        value: csi > 0 ? `${csi.toFixed(2)} / 5` : '-',
        tone: 'accent',
      },
      {
        label: 'Critical Issues Count',
        value: criticalFeedback.length.toString(),
        tone: criticalFeedback.length > 0 ? 'warning' : 'default',
      },
    ] satisfies ExecutiveKpi[]
  }, [criticalFeedback.length, filteredResponses])

  const quadrantInsights = useMemo(() => {
    const performanceCutoff = means.performance > 0 ? means.performance : 3
    const importanceCutoff = means.importance > 0 ? means.importance : 3

    const groups = {
      q1: [] as string[],
      q2: [] as string[],
      q3: [] as string[],
      q4: [] as string[],
    }

    for (const point of ipaPoints) {
      const isHighPerformance = point.performance >= performanceCutoff
      const isHighImportance = point.importance >= importanceCutoff

      if (isHighImportance && !isHighPerformance) {
        groups.q1.push(point.question_text)
        continue
      }

      if (isHighImportance && isHighPerformance) {
        groups.q2.push(point.question_text)
        continue
      }

      if (!isHighImportance && !isHighPerformance) {
        groups.q3.push(point.question_text)
        continue
      }

      groups.q4.push(point.question_text)
    }

    const createInsight = (
      label: string,
      title: string,
      tone: QuadrantInsight['tone'],
      questions: string[],
    ): QuadrantInsight => ({
      label,
      title,
      tone,
      questions,
    })

    return [
      createInsight('Kuadran I', 'Prioritas Utama', 'warning', groups.q1),
      createInsight('Kuadran II', 'Pertahankan Prestasi', 'success', groups.q2),
      createInsight('Kuadran III', 'Prioritas Rendah', 'muted', groups.q3),
      createInsight('Kuadran IV', 'Berlebihan', 'accent', groups.q4),
    ]
  }, [ipaPoints, means.importance, means.performance])

  function handlePrintReport() {
    window.print()
  }

  async function handleRoleChange(userId: string, nextRole: UserRole) {
    if (userId === currentUserId) {
      return
    }

    const selectedUser = users.find((user) => user.id === userId)

    if (!selectedUser || selectedUser.role === nextRole) {
      return
    }

    setUpdatingRoleId(userId)

    const { error: updateError } = await adminRpc.rpc('set_user_role', {
      target_user_id: userId,
      next_role: nextRole,
    })

    if (updateError) {
      toast.error(updateError.message)
      setUpdatingRoleId(null)
      return
    }

    setUsers((current) =>
      current.map((user) => (user.id === userId ? { ...user, role: nextRole } : user)),
    )
    toast.success(`Role diperbarui menjadi ${nextRole}.`)
    setUpdatingRoleId(null)
  }

  async function toggleSurveyStatus() {
    if (!survey) {
      return
    }

    setUpdatingStatus(true)
    setError(null)

    const nextStatus = !survey.is_active

    const { error: updateError } = await adminRpc.rpc('set_survey_status', {
      survey_id: survey.id,
      next_status: nextStatus,
    })

    if (updateError) {
      setError(updateError.message ?? 'Gagal memperbarui status survei.')
      toast.error(updateError.message ?? 'Gagal memperbarui status survei.')
      setUpdatingStatus(false)
      return
    }

    setSurvey((current) =>
      current
        ? {
            ...current,
            is_active: nextStatus,
          }
        : current,
    )
    toast.success(nextStatus ? 'Survei berhasil dibuka.' : 'Survei berhasil ditutup.')
    setUpdatingStatus(false)
  }

  async function handleCreateSurvey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const title = newSurveyTitle.trim()

    if (!title) {
      toast.error('Judul survei baru wajib diisi.')
      return
    }

    setCreatingSurvey(true)

    const { error: insertError } = await supabase
      .from('surveys')
      .insert([{ title, is_active: true } as never])

    if (insertError) {
      toast.error(insertError.message)
      setCreatingSurvey(false)
      return
    }

    setNewSurveyTitle('')
    await loadSurveys()
    toast.success('Survei baru berhasil dibuat.')
    setCreatingSurvey(false)
  }

  async function handleDeleteSurvey(surveyId: string) {
    const targetSurvey = surveys.find((item) => item.id === surveyId)

    if (!targetSurvey) {
      return
    }

    const confirmed = window.confirm(`Hapus survei "${targetSurvey.title}"? Tindakan ini tidak bisa dibatalkan.`)

    if (!confirmed) {
      return
    }

    setDeletingSurveyId(surveyId)

    const { error: deleteError } = await supabase.from('surveys').delete().eq('id', surveyId)

    if (deleteError) {
      toast.error(deleteError.message)
      setDeletingSurveyId(null)
      return
    }

    if (survey?.id === surveyId) {
      setSurvey(null)
      setResponses([])
    }

    if (selectedSurveyId === surveyId) {
      setSelectedSurveyId(null)
      setQuestions([])
      setQuestionsError(null)
    }

    await loadSurveys()
    toast.success('Survei berhasil dihapus.')
    setDeletingSurveyId(null)
  }

  async function handleSelectSurveyQuestions(surveyId: string) {
    setSelectedSurveyId(surveyId)
    setNewQuestionText('')
    setNewQuestionType('dual_likert')
    setNewQuestionRequired(true)
    await loadQuestions(surveyId)
  }

  async function handleCreateQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedSurveyId) {
      toast.error('Pilih survei terlebih dahulu.')
      return
    }

    const questionText = newQuestionText.trim()

    if (!questionText) {
      toast.error('Teks pertanyaan wajib diisi.')
      return
    }

    setCreatingQuestion(true)

    const branchingLogic =
      newQuestionType === 'dual_likert'
        ? {
            show_reason_if: {
              field: 'score_performance',
              operator: '<',
              value: 3,
              target: 'reason',
            },
          }
        : null

    const { error: insertError } = await supabase
      .from('questions')
      .insert([
        {
          survey_id: selectedSurveyId,
          question_text: questionText,
          question_type: newQuestionType,
          is_required: newQuestionRequired,
          options: null,
          branching_logic: branchingLogic,
        } as never,
      ])

    if (insertError) {
      toast.error(insertError.message)
      setCreatingQuestion(false)
      return
    }

    setNewQuestionText('')
    setNewQuestionType('dual_likert')
    setNewQuestionRequired(true)
    await loadQuestions(selectedSurveyId)
    toast.success('Pertanyaan baru berhasil ditambahkan.')
    setCreatingQuestion(false)
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!selectedSurveyId) {
      return
    }

    const targetQuestion = questions.find((question) => question.id === questionId)

    if (!targetQuestion) {
      return
    }

    const confirmed = window.confirm(`Hapus pertanyaan "${targetQuestion.question_text}"?`)

    if (!confirmed) {
      return
    }

    setDeletingQuestionId(questionId)

    const { error: deleteError } = await supabase.from('questions').delete().eq('id', questionId)

    if (deleteError) {
      toast.error(deleteError.message)
      setDeletingQuestionId(null)
      return
    }

    await loadQuestions(selectedSurveyId)
    toast.success('Pertanyaan berhasil dihapus.')
    setDeletingQuestionId(null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
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

  const selectedSurvey = selectedSurveyId
    ? surveys.find((item) => item.id === selectedSurveyId) ?? null
    : null

  const sidebarMenuItems = [
    { key: 'analytics', label: 'Analytics' },
    { key: 'critical-feedback', label: 'Critical Feedback' },
    { key: 'users', label: 'User Management' },
    { key: 'manage-surveys', label: 'Kelola Survei' },
  ]

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const formatSurveyDate = (dateValue: string) =>
    new Date(dateValue).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  const visibleSurveys = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return surveys.filter((surveyItem) => {
      const matchesSearch = !query || surveyItem.title.toLowerCase().includes(query)

      return matchesSearch
    })
  }, [searchQuery, surveys])

  const activeTabTitleMap: Record<typeof activeTab, string> = {
    analytics: 'Analitik Survei',
    'critical-feedback': 'Kelola Keluhan Kritis',
    users: 'Manajemen Pengguna',
    'manage-surveys': 'Kelola Kuesioner',
  }

  return (
    <div className="min-h-screen bg-[#fffcf4] print:bg-white">
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-[230px] flex-col justify-between bg-[#2b2b2b] px-5 py-6 text-white print:hidden">
        <div className="pt-8">
          <nav className="flex flex-col gap-3">
            {sidebarMenuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key as typeof activeTab)}
                className={`rounded-xl px-5 py-3 text-left text-sm font-medium transition-all duration-300 ${
                  activeTab === item.key
                    ? 'bg-[#de7a49] text-white'
                    : 'text-white/90 hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white">AD</span>
            </div>

            <div>
              <h2 className="text-sm font-semibold tracking-tight">Admin LPDP</h2>
              <p className="text-xs text-gray-300">adminlpdp@gmail.com</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#de7a49] px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#C9683B]"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="ml-[230px] flex min-h-screen flex-1 flex-col print:ml-0">
        <header className="sticky top-0 z-40 bg-light-grey shadow-sm print:hidden">
          <div className="flex min-h-24 items-center justify-between gap-6 px-6 py-4 md:px-10">
            <div className="flex min-w-0 items-center gap-4">
              <img src="/logo_lpdp.png" alt="LPDP Logo" className="h-10 w-auto shrink-0 object-contain" />
              <div className="min-w-0 leading-tight">
                <h1 className="truncate text-base font-semibold tracking-tight text-[#2b2b2b] md:text-lg">
                  {activeTabTitleMap[activeTab]}
                </h1>
                <p className="truncate text-sm font-medium tracking-tight text-oren-muda">
                  Survey Awardee LPDP
                </p>
              </div>
            </div>

            <h1 className="shrink-0 text-md font-medium tracking-tight text-ash md:text-md">{formattedDate}</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-10 text-slate-900 print:bg-white print:px-0 print:py-0 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <section className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none sm:p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#F97316]">
                    Admin Command Center
                  </p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight tracking-[-0.04em] text-[#003366] sm:text-4xl">
                    IPA Analytics Dashboard
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                    Visualisasi ini merangkum matriks Importance-Performance Analysis dari jawaban
                    dual_likert untuk membantu tim melihat prioritas perbaikan layanan.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-gray-100 bg-slate-50 px-4 py-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <p className="text-sm font-medium text-gray-500">Survey</p>
                    <p className="mt-1 text-4xl font-extrabold tracking-tight text-slate-900">{survey?.title ?? '-'}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-slate-50 px-4 py-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <p className="text-sm font-medium text-gray-500">Mean X</p>
                    <p className="mt-1 text-4xl font-extrabold tracking-tight text-slate-900">
                      {means.performance.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-slate-50 px-4 py-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <p className="text-sm font-medium text-gray-500">Mean Y</p>
                    <p className="mt-1 text-4xl font-extrabold tracking-tight text-slate-900">
                      {means.importance.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center rounded-full bg-transparent px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-gray-100 hover:text-slate-900"
                  >
                    Kembali ke Landing Page
                  </Link>
                  {survey ? (
                    <button
                      type="button"
                      onClick={toggleSurveyStatus}
                      disabled={updatingStatus}
                      className="inline-flex items-center justify-center rounded-full bg-[#003366] px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
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
              {activeTab === 'analytics' ? (
                <section className="mt-8 space-y-6 print:mt-4 print:block">
                  <div className="grid gap-4 md:grid-cols-3 print:grid print:grid-cols-3 print:gap-3">
                    {executiveKpis.map((kpi) => (
                      <article
                        key={kpi.label}
                        className={`rounded-2xl border bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] print:shadow-none ${
                          kpi.tone === 'warning'
                            ? 'border-red-200'
                            : kpi.tone === 'accent'
                              ? 'border-[#003366]/20'
                              : 'border-slate-200'
                        }`}
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {kpi.label}
                        </p>
                        <p
                          className={`mt-3 text-2xl font-semibold tracking-[-0.04em] ${
                            kpi.tone === 'warning'
                              ? 'text-red-700'
                              : kpi.tone === 'accent'
                                ? 'text-[#003366]'
                                : 'text-slate-900'
                          }`}
                        >
                          {kpi.value}
                        </p>
                      </article>
                    ))}
                  </div>

                  <div className="grid gap-6 xl:grid-cols-2 print:grid print:grid-cols-2 print:gap-4">
                    <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 sm:p-6 print:rounded-none print:border-0 print:bg-white print:p-0 print:break-inside-avoid">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Tren Partisipasi</h2>
                          <p className="mt-1 text-sm text-slate-600">
                            Total respons per tanggal berdasarkan data yang sudah difilter.
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 h-[300px] w-full rounded-[1.5rem] bg-white p-3 print:h-[240px] print:rounded-none print:bg-white print:p-0 print:break-inside-avoid">
                        {participationTrend.length ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={participationTrend} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                              <Tooltip />
                              <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#F26522"
                                strokeWidth={3}
                                dot={{ r: 3 }}
                                activeDot={{ r: 5 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center rounded-[1.25rem] border border-dashed border-slate-300 text-sm text-slate-600">
                            Belum ada data partisipasi untuk grafik ini.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[2rem] border border-gray-100 bg-slate-50 p-5 sm:p-6 print:rounded-none print:border-0 print:bg-white print:p-0 print:break-inside-avoid shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Sebaran Provinsi</h2>
                          <p className="mt-1 text-sm text-slate-600">
                            Distribusi asal provinsi dari respons pada filter aktif.
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 h-[300px] w-full rounded-[1.5rem] bg-white p-3 print:h-[240px] print:rounded-none print:bg-white print:p-0 print:break-inside-avoid">
                        {provinceDistribution.length ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={provinceDistribution}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={68}
                                outerRadius={104}
                                paddingAngle={2}
                              >
                                {provinceDistribution.map((entry, index) => (
                                  <Cell key={`${entry.name}-${index}`} fill={provinceColors[index % provinceColors.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend layout="vertical" verticalAlign="middle" align="right" />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center rounded-[1.25rem] border border-dashed border-slate-300 text-sm text-slate-600">
                            Belum ada data provinsi untuk ditampilkan.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] print:block print:gap-0">
                    <div className="rounded-[2rem] border border-gray-100 bg-slate-50 p-5 sm:p-6 print:rounded-none print:border-0 print:bg-white print:p-0 print:break-inside-avoid shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between print:block">
                        <div>
                          <h2 className="text-lg font-semibold tracking-tight text-slate-900">IPA Scatter Plot</h2>
                          <p className="mt-1 text-sm text-slate-600">
                            Kiri bawah ke kanan atas menggambarkan distribusi kuadran.
                          </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end print:hidden">
                          <label className="block text-sm font-medium text-slate-700" htmlFor="province-filter">
                            Asal Provinsi
                            <select
                              id="province-filter"
                              value={selectedProvince}
                              onChange={(event) => setSelectedProvince(event.target.value)}
                              className="mt-2 w-full min-w-[220px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            >
                              <option value="all">Semua Provinsi</option>
                              {provinceOptions.map((province) => (
                                <option key={province} value={province}>
                                  {province}
                                </option>
                              ))}
                            </select>
                          </label>
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
                      </div>

                      <div className="mt-6 h-[420px] w-full rounded-[1.5rem] bg-white p-3 print:mt-4 print:h-auto print:rounded-none print:bg-white print:p-0 print:break-inside-avoid">
                        <ScatterPlot data={ipaPoints} meanPerformance={means.performance} meanImportance={means.importance} />
                      </div>
                    </div>

                    <div className="rounded-[2rem] border border-gray-100 bg-slate-50 p-5 sm:p-6 print:mt-4 print:rounded-none print:border-0 print:bg-white print:p-0 print:break-inside-avoid shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                      <h2 className="text-lg font-semibold tracking-tight text-slate-900">Ringkasan Kuadran</h2>
                      <div className="mt-4 space-y-3 text-sm text-slate-700">
                        {['Q1: Prioritas Utama', 'Q2: Pertahankan Prestasi', 'Q3: Prioritas Rendah', 'Q4: Berlebihan'].map((label) => (
                          <div key={label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                            {label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

              {activeTab === 'analytics' ? (
                <section className="mt-8 rounded-[2rem] border border-slate-200 bg-slate-50 p-5 sm:p-6 print:rounded-none print:border-0 print:bg-white print:p-0 print:break-inside-avoid">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                      IPA Quadrant Actionable Insights
                    </h2>
                    <p className="text-sm text-slate-600">
                      Pertanyaan dikelompokkan otomatis berdasarkan garis pemotong mean Performance dan Importance pada data yang sudah difilter.
                    </p>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {quadrantInsights.map((quadrant) => {
                      const toneClasses =
                        quadrant.tone === 'warning'
                          ? 'border-red-200 bg-red-50'
                          : quadrant.tone === 'success'
                            ? 'border-emerald-200 bg-emerald-50'
                            : quadrant.tone === 'accent'
                              ? 'border-[#003366]/15 bg-[#003366]/5'
                              : 'border-amber-200 bg-amber-50'

                      const titleClasses =
                        quadrant.tone === 'warning'
                          ? 'text-red-700'
                          : quadrant.tone === 'success'
                            ? 'text-emerald-700'
                            : quadrant.tone === 'accent'
                              ? 'text-[#003366]'
                              : 'text-amber-700'

                      return (
                        <article
                          key={quadrant.label}
                          className={`rounded-[1.5rem] border p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] print:shadow-none ${toneClasses}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${titleClasses}`}>
                                {quadrant.label}
                              </p>
                              <h3 className="mt-2 text-base font-semibold tracking-tight text-slate-900">
                                {quadrant.title}
                              </h3>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              {quadrant.questions.length}
                            </span>
                          </div>

                          <div className="mt-4">
                            {quadrant.questions.length ? (
                              <ul className="space-y-2 text-sm leading-6 text-slate-700">
                                {quadrant.questions.map((question) => (
                                  <li key={question} className="flex gap-2">
                                    <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${quadrant.tone === 'warning' ? 'bg-red-500' : quadrant.tone === 'success' ? 'bg-emerald-500' : quadrant.tone === 'accent' ? 'bg-[#003366]' : 'bg-amber-500'}`} />
                                    <span>{question}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm leading-6 text-slate-600">
                                Tidak ada indikator di kuadran ini.
                              </p>
                            )}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </section>
              ) : null}

              {activeTab === 'critical-feedback' ? (
                <section className="mt-8 rounded-[2rem] border border-gray-100 bg-slate-50 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight text-slate-900">Critical Feedback</h2>
                      <p className="mt-1 text-sm text-slate-600">
                        Keluhan dengan skor performance di bawah 3 dan alasan yang diisi, sudah mengikuti filter provinsi aktif.
                      </p>
                    </div>
                    <span className="rounded-full bg-[#003366]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#003366]">
                      {criticalFeedback.length} feedback
                    </span>
                  </div>

                  {criticalFeedback.length ? (
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      {criticalFeedback.map((feedback, index) => (
                        <article
                          key={`${feedback.response_id}-${feedback.question_text}-${index}`}
                          className="rounded-[1.5rem] border border-amber-200 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)]"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F97316]">
                                Question Text
                              </p>
                              <h3 className="mt-2 text-base font-semibold tracking-tight text-slate-900">
                                {feedback.question_text}
                              </h3>
                            </div>
                            <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
                              Performance {feedback.performance}
                            </span>
                          </div>

                          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-600">
                              Keluhan
                            </p>
                            <p className="mt-2 text-sm leading-7 text-slate-700">
                              {feedback.reason}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-[1.5rem] border border-gray-100 bg-white p-8 text-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                      <p className="text-base font-semibold text-slate-900">
                        Semua responden puas dengan layanan periode ini.
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        Tidak ada feedback kritis yang memenuhi kriteria pada filter provinsi saat ini.
                      </p>
                    </div>
                  )}
                </section>
              ) : null}

              {activeTab === 'users' ? (
                <section className="mt-8 rounded-[2rem] border border-gray-100 bg-slate-50 p-5 sm:p-6 print:hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight text-slate-900">User Management</h2>
                      <p className="mt-1 text-sm text-slate-600">
                        Kelola role user tanpa akses manual ke database.
                      </p>
                    </div>
                  </div>

                  {usersLoading ? (
                    <div className="mt-5">
                      <LoadingSpinner />
                    </div>
                  ) : usersError ? (
                    <p className="mt-5 text-sm text-red-600">{usersError}</p>
                  ) : (
                    <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                          <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                            <tr>
                              <th className="px-4 py-3">Nama</th>
                              <th className="px-4 py-3">Email</th>
                              <th className="px-4 py-3">Role</th>
                              <th className="px-4 py-3">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {users.map((user) => (
                              <tr key={user.id}>
                                <td className="px-4 py-3 font-medium text-slate-900">
                                  {user.full_name || '-'}
                                  {user.id === currentUserId ? (
                                    <span className="ml-2 rounded-full bg-[#F97316]/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F97316]">
                                      You
                                    </span>
                                  ) : null}
                                </td>
                                <td className="px-4 py-3 text-slate-600">{user.email ?? '-'}</td>
                                <td className="px-4 py-3 text-slate-600">
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                                    {user.role}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  <select
                                    value={user.role}
                                    disabled={user.id === currentUserId || updatingRoleId === user.id}
                                    onChange={(event) =>
                                      void handleRoleChange(user.id, event.target.value as UserRole)
                                    }
                                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                                  >
                                    <option value="awardee">awardee</option>
                                    <option value="admin">admin</option>
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </section>
              ) : null}

              {activeTab === 'manage-surveys' ? (
                <section className="mt-8 rounded-[2rem] border border-[#ab924f] bg-[#fffcf4] p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] print:hidden">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#bd5b2c]">
                        Survey List
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#2b2b2b]">
                        Your Surveys
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7a5d3a]">
                        Kelola survei aktif, arsip, dan draft dari satu tampilan kartu yang responsif.
                      </p>
                    </div>

                    <form
                      onSubmit={(event) => void handleCreateSurvey(event)}
                      className="flex w-full flex-col gap-3 sm:max-w-xl lg:max-w-2xl"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <label className="block flex-1 text-sm font-medium text-[#2b2b2b]">
                          Judul Survei Baru
                          <input
                            type="text"
                            value={newSurveyTitle}
                            onChange={(event) => setNewSurveyTitle(event.target.value)}
                            placeholder="Contoh: Survei Kepuasan Layanan LPDP 2027"
                            className="mt-2 w-full rounded-2xl border border-[#ab924f] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-shadow focus:outline-none focus:ring-2 focus:ring-[#de7a49]/30 focus:ring-offset-1"
                          />
                        </label>
                        <button
                          type="submit"
                          disabled={creatingSurvey}
                          className="inline-flex items-center justify-center rounded-full bg-[#de7a49] px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Plus size={16} className="mr-2" />
                          {creatingSurvey ? 'Membuat...' : '+ New Survey'}
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      className="rounded-full bg-[#de7a49] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-[#ab924f] bg-white px-5 py-2.5 text-sm font-semibold text-[#bd5b2c] transition hover:bg-[#fff8ec]"
                    >
                      Archived
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-[#ab924f] bg-white px-5 py-2.5 text-sm font-semibold text-[#bd5b2c] transition hover:bg-[#fff8ec]"
                    >
                      Draft
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSearchOpen((current) => !current)}
                      aria-label="Toggle pencarian kuesioner"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#ab924f] bg-white text-[#bd5b2c] transition hover:bg-[#fff8ec]"
                    >
                      <Search size={18} />
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ease-out ${isSearchOpen ? 'max-w-[280px] opacity-100' : 'max-w-0 opacity-0'}`}
                    >
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Cari kuesioner..."
                        className="w-[280px] rounded-full border border-[#ab924f] bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#de7a49] focus:ring-4 focus:ring-[#de7a49]/10"
                      />
                    </div>
                  </div>

                  {surveysLoading ? (
                    <div className="mt-5">
                      <LoadingSpinner />
                    </div>
                  ) : surveysError ? (
                    <p className="mt-5 text-sm text-red-600">{surveysError}</p>
                  ) : (
                    <div className="mt-6 space-y-4">
                      {visibleSurveys.map((item) => (
                        <article
                          key={item.id}
                          className="rounded-xl border border-[#ab924f] bg-white p-4 shadow-[0_4px_18px_-6px_rgba(0,0,0,0.08)] transition-transform duration-300 hover:-translate-y-0.5"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0">
                              <h3 className="text-xl font-semibold tracking-tight text-[#2b2b2b]">
                                {item.title}
                              </h3>
                              <p className="mt-2 text-sm font-medium text-[#bd5b2c]">
                                Periode pengisian 1 Januari - 30 Juni 2026
                              </p>
                              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#7a5d3a]">
                                <span>30 Questions</span>
                                <span className="h-4 w-px bg-[#ab924f]" aria-hidden="true" />
                                <span>Last Modified {formatSurveyDate(item.created_at)}</span>
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${item.is_active ? 'bg-[#de7a49] text-white' : 'border border-[#ab924f] bg-white text-[#bd5b2c]'}`}>
                                  {item.is_active ? 'Active' : 'Draft'}
                                </span>
                              </div>
                            </div>

                            <div className="flex shrink-0 flex-wrap gap-3 lg:justify-end">
                              <button
                                type="button"
                                onClick={() => void handleSelectSurveyQuestions(item.id)}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#56c4ff] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-95"
                              >
                                <Pencil size={16} />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteSurvey(item.id)}
                                disabled={deletingSurveyId === item.id}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#ff5656] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <Trash2 size={16} />
                                {deletingSurveyId === item.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 rounded-[1.5rem] border border-gray-100 bg-white p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] sm:p-5">
                    {selectedSurvey ? (
                      <>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#F97316]">
                              Detail Pertanyaan
                            </p>
                            <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">
                              {selectedSurvey.title}
                            </h3>
                          </div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                            {questions.length} pertanyaan
                          </span>
                        </div>

                        <form
                          onSubmit={(event) => void handleCreateQuestion(event)}
                          className="mt-5 grid gap-4 rounded-[1.25rem] border border-gray-100 bg-slate-50 p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] lg:grid-cols-[1.4fr_0.7fr_0.6fr_auto] lg:items-end"
                        >
                          <label className="block text-sm font-medium text-slate-700 lg:col-span-1">
                            Teks Pertanyaan
                            <input
                              type="text"
                              value={newQuestionText}
                              onChange={(event) => setNewQuestionText(event.target.value)}
                              placeholder="Contoh: Bagaimana penilaian Anda terhadap layanan ini?"
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            />
                          </label>

                          <label className="block text-sm font-medium text-slate-700">
                            Tipe Data
                            <select
                              value={newQuestionType}
                              onChange={(event) => setNewQuestionType(event.target.value as SurveyQuestionFormType)}
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            >
                              <option value="dual_likert">Matriks IPA / Dual Likert</option>
                              <option value="text">Isian Bebas / Esai</option>
                            </select>
                          </label>

                          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                            <input
                              type="checkbox"
                              checked={newQuestionRequired}
                              onChange={(event) => setNewQuestionRequired(event.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-[#003366] focus:ring-[#F97316]"
                            />
                            Wajib Diisi
                          </label>

                          <button
                            type="submit"
                            disabled={creatingQuestion}
                            className="inline-flex items-center justify-center rounded-full bg-[#003366] px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {creatingQuestion ? 'Menyimpan...' : 'Tambah Pertanyaan'}
                          </button>
                        </form>

                        {questionsLoading ? (
                          <div className="mt-5">
                            <LoadingSpinner />
                          </div>
                        ) : questionsError ? (
                          <p className="mt-5 text-sm text-red-600">{questionsError}</p>
                        ) : questions.length ? (
                          <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                                  <tr>
                                    <th className="px-4 py-3">Teks</th>
                                    <th className="px-4 py-3">Tipe</th>
                                    <th className="px-4 py-3">Wajib</th>
                                    <th className="px-4 py-3">Aksi</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                  {questions.map((question) => (
                                    <tr key={question.id}>
                                      <td className="px-4 py-3 font-medium text-slate-900">
                                        {question.question_text}
                                      </td>
                                      <td className="px-4 py-3 text-slate-600">
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                                          {question.question_type === 'dual_likert'
                                            ? 'Dual Likert'
                                            : 'Esai'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-slate-600">
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${question.is_required ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                          {question.is_required ? 'Ya' : 'Tidak'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-slate-600">
                                        <button
                                          type="button"
                                          onClick={() => void handleDeleteQuestion(question.id)}
                                          disabled={deletingQuestionId === question.id}
                                          className="inline-flex items-center justify-center rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                          {deletingQuestionId === question.id ? '...' : 'Hapus'}
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-5 rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
                            Belum ada pertanyaan untuk survei ini.
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="py-10 text-center">
                        <p className="text-base font-semibold text-slate-900">Pilih survei untuk mengelola pertanyaan.</p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">
                          Klik tombol Kelola Pertanyaan pada baris survei yang ingin diedit.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              ) : null}

              {activeTab === 'analytics' ? (
                <>
                  <section className="mt-8 rounded-[2rem] border border-gray-100 bg-slate-50 p-5 sm:p-6 print:hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Raw Data</h2>
                        <p className="mt-1 text-sm text-slate-600">
                          Jawaban mentah untuk analisis lanjutan atau ekspor CSV.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={exportCsv}
                          className="inline-flex items-center justify-center rounded-full bg-[#F97316] px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-95"
                        >
                          Export CSV
                        </button>
                        <button
                          type="button"
                          onClick={handlePrintReport}
                          className="inline-flex items-center justify-center rounded-full bg-[#003366] px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-95"
                        >
                          Cetak Laporan PDF
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
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
              ) : null}
            </>
          )}
        </section>
      </div>
    </main>
    </div>
  </div>
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