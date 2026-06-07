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
import { ArchiveX, ExternalLink, Plus, Search, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Database, SurveyWithCount } from '../../types/database'
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

const provinceColors = ['#1C4999', '#DE7A49', '#BD5B2C', '#71CDFF', '#AB924F', '#2B2B2B']

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

function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [survey, setSurvey] = useState<SurveyRow | null>(null)
  // Gunakan SurveyWithCount agar question_count sudah ter-fetch sekaligus (tanpa N+1)
  const [surveys, setSurveys] = useState<SurveyWithCount[]>([])
  const [responses, setResponses] = useState<ResponseWithAnswers[]>([])
  const [selectedProvince, setSelectedProvince] = useState('all')
  const [activeTab, setActiveTab] = useState<'analytics' | 'critical-feedback' | 'users' | 'manage-surveys'>('analytics')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  // Tab status: 'all' | 'active' | 'inactive'
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [surveyIdToDelete, setSurveyIdToDelete] = useState<string | null>(null)
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [deletingSurveyId, setDeletingSurveyId] = useState<string | null>(null)
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null)
  // Pagination: 20 per halaman default
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Map sub-routes to active tabs
  useEffect(() => {
    if (location.pathname === '/admin/surveys') {
      setActiveTab('manage-surveys')
    } else if (location.pathname === '/admin/respondents') {
      setActiveTab('users')
    } else if (location.pathname === '/admin/critical-feedback') {
      setActiveTab('critical-feedback')
    } else {
      setActiveTab('analytics')
    }
  }, [location.pathname])

  /**
   * loadSurveys: Gunakan view `survey_with_question_count` agar jumlah
   * pertanyaan dihitung di sisi DB (satu query, eliminasi N+1 query).
   */
  async function loadSurveys() {
    setSurveysLoading(true)
    setSurveysError(null)
    const { data, error: surveyListError } = await (supabase as any)
      .from('survey_with_question_count')
      .select('id, title, is_active, created_at, question_count')
      .order('created_at', { ascending: false })

    if (surveyListError) {
      setSurveysError(surveyListError.message)
      setSurveys([])
    } else {
      setSurveys((data ?? []) as SurveyWithCount[])
    }

    setSurveysLoading(false)
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

      // Load surveys list via view untuk efisiensi (sekalian dapat question_count)
      const { data: surveysData, error: surveysListError } = await (supabase as any)
        .from('survey_with_question_count')
        .select('id, title, is_active, created_at, question_count')
        .order('created_at', { ascending: false })

      if (surveysListError) {
        if (!cancelled) {
          setSurveysError(surveysListError.message)
        }
      } else if (surveysData && !cancelled) {
        setSurveys(surveysData as SurveyWithCount[])
      }

      const surveyRows = (surveysData ?? []) as SurveyRow[]

      let resolvedSurvey: SurveyRow | null = null
      if (surveyRows.length > 0) {
        const seed = surveyRows.find((s: SurveyRow) => s.title === 'Survei Kepuasan Layanan LPDP 2026')
        resolvedSurvey = seed || surveyRows[0]
      }

      if (!resolvedSurvey) {
        if (!cancelled) {
          setError('Belum ada kuesioner terdaftar di database.')
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

  async function handleSurveyChange(surveyId: string) {
    const selected = surveys.find((s) => s.id === surveyId)
    if (!selected) return

    setLoading(true)
    setError(null)
    const { data: responsesData, error: respError } = await supabase
      .from('responses')
      .select(
        'id, survey_id, submitted_at, answers(id, response_id, question_id, text_value, score_performance, score_importance, reason, questions(id, question_text, question_type))',
      )
      .eq('survey_id', surveyId)
      .order('submitted_at', { ascending: false })

    if (respError) {
      setError(respError.message)
    } else {
      setSurvey(selected)
      setResponses((responsesData ?? []) as ResponseWithAnswers[])
    }
    setLoading(false)
  }

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
    setIsCreateModalOpen(false)
    await loadSurveys()
    toast.success('Survei baru berhasil dibuat.')
    setCreatingSurvey(false)
  }

  async function handleDeleteSurvey(surveyId: string) {
    const targetSurvey = surveys.find((item) => item.id === surveyId)

    if (!targetSurvey) {
      return
    }

    setSurveyIdToDelete(null)
    setDeletingSurveyId(surveyId)

    const { error: deleteError } = await supabase.from('surveys').delete().eq('id', surveyId)

    if (deleteError) {
      toast.error(deleteError.message)
      setDeletingSurveyId(null)
      return
    }

    await loadSurveys()
    toast.success('Survei berhasil dihapus.')
    setDeletingSurveyId(null)
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


  const formatSurveyDate = (dateValue: string) =>
    new Date(dateValue).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  // Toggle status aktif/nonaktif untuk satu survei di halaman manage-surveys
  async function handleToggleSurveyStatus(surveyItem: SurveyWithCount) {
    setTogglingStatusId(surveyItem.id)
    const nextStatus = !surveyItem.is_active

    const { error: updateError } = await adminRpc.rpc('set_survey_status', {
      survey_id: surveyItem.id,
      next_status: nextStatus,
    })

    if (updateError) {
      toast.error(updateError.message ?? 'Gagal memperbarui status survei.')
    } else {
      setSurveys((prev) =>
        prev.map((s) => (s.id === surveyItem.id ? { ...s, is_active: nextStatus } : s)),
      )
      toast.success(nextStatus ? 'Survei berhasil diaktifkan.' : 'Survei berhasil dinonaktifkan.')
    }
    setTogglingStatusId(null)
  }

  const visibleSurveys = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return surveys.filter((surveyItem) => {
      const matchesStatus =
        activeStatusFilter === 'all'
          ? true
          : activeStatusFilter === 'active'
            ? surveyItem.is_active
            : !surveyItem.is_active

      const matchesSearch = !query || surveyItem.title.toLowerCase().includes(query)
      return matchesStatus && matchesSearch
    })
  }, [activeStatusFilter, searchQuery, surveys])

  // Pagination: potong hasil setelah filter
  const totalPages = Math.ceil(visibleSurveys.length / pageSize)
  const paginatedSurveys = visibleSurveys.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  return (
    <div className="space-y-8 print:p-0">
      {activeTab === 'analytics' && location.pathname === '/admin' && (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-baseline lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-oren">
              Admin Command Center
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight tracking-[-0.04em] text-navy sm:text-4xl">
              IPA Analytics Dashboard
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ash/80">
              Visualisasi ini merangkum matriks Importance-Performance Analysis dari jawaban
              dual_likert untuk membantu tim melihat prioritas perbaikan layanan.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-3 print:hidden">
            {surveys.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  id="survey-selector"
                  value={survey?.id || ''}
                  onChange={(e) => void handleSurveyChange(e.target.value)}
                  className="rounded-xl border border-light-grey bg-white px-4 py-2.5 text-sm font-semibold text-ash outline-none transition focus:border-oren focus:ring-4 focus:ring-oren/10 cursor-pointer shadow-sm hover:bg-slate-50"
                >
                  {surveys.map((s: SurveyRow) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl bg-transparent px-5 py-3 text-sm font-semibold text-ash transition-colors hover:bg-light-grey hover:text-ash"
            >
              Kembali ke Landing Page
            </Link>
          </div>
        </div>
      )}


      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="mt-8 text-sm text-red-600">{error}</p>
      ) : (
        <>
          {activeTab === 'analytics' ? (
            <section className="mt-8 space-y-6 print:mt-4 print:block">
              {/* Active Survey and Means Cards */}
              <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr] items-stretch">
                <div className="rounded-xl border border-light-grey bg-oren-muda p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between sm:flex-row sm:items-center gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                      Survei Aktif
                    </p>
                    <h3 className="mt-2 text-lg font-bold tracking-tight text-white md:text-xl">
                      {survey?.title ?? '-'}
                    </h3>
                  </div>
                  {survey && (
                    <button
                      type="button"
                      onClick={toggleSurveyStatus}
                      disabled={updatingStatus}
                      className="inline-flex items-center justify-center rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer shrink-0 print:hidden"
                    >
                      {updatingStatus
                        ? 'Memperbarui...'
                        : survey.is_active
                          ? 'Tutup Survei'
                          : 'Buka Survei'}
                    </button>
                  )}
                </div>

                <div className="rounded-xl border border-light-grey bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ash/60">
                    Mean X (Performance)
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-ash">
                    {means.performance.toFixed(2)}
                  </p>
                </div>

                <div className="rounded-xl border border-light-grey bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ash/60">
                    Mean Y (Importance)
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-ash">
                    {means.importance.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid gap-4 md:grid-cols-3 print:grid print:grid-cols-3 print:gap-3">
                {executiveKpis.map((kpi) => (
                  <article
                    key={kpi.label}
                    className={`rounded-xl border bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] print:shadow-none ${
                      kpi.tone === 'warning'
                        ? 'border-red-200'
                        : kpi.tone === 'accent'
                          ? 'border-navy/20'
                          : 'border-light-grey'
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ash/60">
                      {kpi.label}
                    </p>
                    <p
                      className={`mt-3 text-2xl font-semibold tracking-[-0.04em] ${
                        kpi.tone === 'warning'
                          ? 'text-red-700'
                          : kpi.tone === 'accent'
                            ? 'text-navy'
                            : 'text-ash'
                      }`}
                    >
                      {kpi.value}
                    </p>
                  </article>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-2 print:grid print:grid-cols-2 print:gap-4">
                <div className="rounded-xl border border-[#E7E4DC] bg-[#FFFfff] p-5 sm:p-6 print:rounded-none print:border-0 print:bg-white print:p-0 print:break-inside-avoid">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight text-ash">Tren Partisipasi</h2>
                      <p className="mt-1 text-sm text-ash/80">
                        Total respons per tanggal berdasarkan data yang sudah difilter.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 h-[300px] w-full rounded-xl bg-white p-3 print:h-[240px] print:rounded-none print:bg-white print:p-0 print:break-inside-avoid">
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
                            stroke="#DE7A49"
                            strokeWidth={3}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#E7E4DC] text-sm text-ash/60">
                        Belum ada data partisipasi untuk grafik ini.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-[#E7E4DC] bg-[#FFFfff] p-5 sm:p-6 print:rounded-none print:border-0 print:bg-white print:p-0 print:break-inside-avoid shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight text-ash">Sebaran Provinsi</h2>
                      <p className="mt-1 text-sm text-ash/80">
                        Distribusi asal provinsi dari respons pada filter aktif.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 h-[300px] w-full rounded-xl bg-white p-3 print:h-[240px] print:rounded-none print:bg-white print:p-0 print:break-inside-avoid">
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
                      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#E7E4DC] text-sm text-ash/60">
                        Belum ada data provinsi untuk ditampilkan.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] print:block print:gap-0">
                <div className="rounded-xl border border-light-grey bg-white p-5 sm:p-6 print:rounded-none print:border-0 print:bg-white print:p-0 print:break-inside-avoid shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between print:block">
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight text-ash">IPA Scatter Plot</h2>
                      <p className="mt-1 text-sm text-ash/80">
                        Kiri bawah ke kanan atas menggambarkan distribusi kuadran.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end print:hidden">
                      <label className="block text-sm font-medium text-ash" htmlFor="province-filter">
                        Asal Provinsi
                        <select
                          id="province-filter"
                          value={selectedProvince}
                          onChange={(event) => setSelectedProvince(event.target.value)}
                          className="mt-2 w-full min-w-[220px] rounded-xl border border-light-grey bg-white px-4 py-3 text-sm text-ash outline-none transition-shadow focus:outline-none focus:ring-2 focus:ring-navy/30 focus:ring-offset-1"
                        >
                          <option value="all">Semua Provinsi</option>
                          {provinceOptions.map((province) => (
                            <option key={province} value={province}>
                              {province}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="mt-6 h-[420px] w-full rounded-xl bg-white p-3 print:mt-4 print:h-auto print:rounded-none print:bg-white print:p-0 print:break-inside-avoid">
                    <ScatterPlot data={ipaPoints} meanPerformance={means.performance} meanImportance={means.importance} />
                  </div>
                </div>
                <div className="rounded-xl border border-light-grey bg-white p-5 sm:p-6 print:mt-4 print:rounded-none print:border-0 print:bg-white print:p-0 print:break-inside-avoid shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                  <h2 className="text-lg font-semibold tracking-tight text-ash">Ringkasan Kuadran</h2>
                  <div className="mt-4 space-y-3 text-sm text-ash/80">
                    {['Q1: Prioritas Utama', 'Q2: Pertahankan Prestasi', 'Q3: Prioritas Rendah', 'Q4: Berlebihan'].map((label) => (
                      <div key={label} className="rounded-xl border border-light-grey bg-white px-4 py-3 text-ash">
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeTab === 'analytics' ? (
            <div className="mt-8 rounded-xl border border-light-grey bg-white p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] print:rounded-none print:border-0 print:bg-white print:p-0 print:break-inside-avoid">
              <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold tracking-tight text-ash">
                  IPA Quadrant Actionable Insights
                </h2>
                <p className="text-sm text-ash/80">
                  Pertanyaan dikelompokkan otomatis berdasarkan garis pemotong mean Performance dan Importance pada data yang sudah difilter.
                </p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {quadrantInsights.map((quadrant) => {
                  const toneClasses =
                    quadrant.tone === 'warning'
                      ? 'border-red-100 bg-red-50/50'
                      : quadrant.tone === 'success'
                        ? 'border-emerald-100 bg-emerald-50/50'
                        : quadrant.tone === 'accent'
                          ? 'border-navy/15 bg-navy/5'
                          : 'border-amber-100 bg-amber-50/50'

                  const titleClasses =
                    quadrant.tone === 'warning'
                      ? 'text-red-700'
                      : quadrant.tone === 'success'
                        ? 'text-emerald-700'
                        : quadrant.tone === 'accent'
                          ? 'text-navy'
                          : 'text-amber-700'

                  return (
                    <article
                      key={quadrant.label}
                      className={`rounded-xl border p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] print:shadow-none ${toneClasses}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${titleClasses}`}>
                            {quadrant.label}
                          </p>
                          <h3 className="mt-2 text-base font-semibold tracking-tight text-ash">
                            {quadrant.title}
                          </h3>
                        </div>
                        <span className="rounded-xl bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ash/60">
                          {quadrant.questions.length}
                        </span>
                      </div>

                      <div className="mt-4">
                        {quadrant.questions.length ? (
                          <ul className="space-y-2 text-sm leading-6 text-ash/90">
                            {quadrant.questions.map((question) => (
                              <li key={question} className="flex gap-2">
                                <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${quadrant.tone === 'warning' ? 'bg-red-500' : quadrant.tone === 'success' ? 'bg-emerald-500' : quadrant.tone === 'accent' ? 'bg-navy' : 'bg-[#AB924F]'}`} />
                                <span>{question}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm leading-6 text-ash/60">
                            Tidak ada indikator di kuadran ini.
                          </p>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          ) : null}

          {activeTab === 'critical-feedback' ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-oren">
                    Daftar Umpan Balik
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ash">
                    Umpan Balik Kritis
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-ash/80">
                    Keluhan dengan skor performa di bawah 3 dan alasan yang diisi, sudah mengikuti filter provinsi aktif.
                  </p>
                </div>
                <span className="rounded-xl bg-navy/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-navy">
                  {criticalFeedback.length} feedback
                </span>
              </div>

              {criticalFeedback.length ? (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {criticalFeedback.map((feedback, index) => (
                    <article
                      key={`${feedback.response_id}-${feedback.question_text}-${index}`}
                      className="rounded-xl border border-light-grey bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-oren">
                            Teks Pertanyaan
                          </p>
                          <h3 className="mt-2 text-base font-semibold tracking-tight text-ash">
                            {feedback.question_text}
                          </h3>
                        </div>
                        <span className="rounded-xl bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
                          Performance {feedback.performance}
                        </span>
                      </div>

                      <div className="mt-4 rounded-xl border border-red-100 bg-red-50/50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-600">
                          Keluhan
                        </p>
                        <p className="mt-2 text-sm leading-7 text-ash/90">
                          {feedback.reason}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-[#E7E4DC] bg-white p-8 text-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                  <p className="text-base font-semibold text-ash">
                    Semua responden puas dengan layanan periode ini.
                  </p>
                  <p className="mt-2 text-sm leading-7 text-ash/80">
                    Tidak ada feedback kritis yang memenuhi kriteria pada filter provinsi saat ini.
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {activeTab === 'users' ? (
            <div className="space-y-6 print:hidden">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-oren">
                    Daftar Pengguna
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ash">
                    Manajemen Pengguna
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-ash/80">
                    Kelola peran pengguna tanpa akses manual ke database.
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
                <div className="mt-5 overflow-hidden rounded-xl border border-[#E7E4DC] bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#E7E4DC] text-left text-sm">
                      <thead className="bg-[#E7E4DC]/55 text-xs uppercase tracking-[0.16em] text-ash/70">
                        <tr>
                          <th className="px-4 py-3">Nama</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7E4DC]">
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td className="px-4 py-3 font-medium text-ash">
                              {user.full_name || '-'}
                              {user.id === currentUserId ? (
                                <span className="ml-2 rounded-xl bg-oren/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-oren">
                                  You
                                </span>
                              ) : null}
                            </td>
                            <td className="px-4 py-3 text-ash/80">{user.email ?? '-'}</td>
                            <td className="px-4 py-3 text-ash/80">
                              <span className="rounded-xl bg-[#F5E8C6]/45 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ash/90">
                                {user.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-ash/80">
                              <select
                                value={user.role}
                                disabled={user.id === currentUserId || updatingRoleId === user.id}
                                onChange={(event) =>
                                  void handleRoleChange(user.id, event.target.value as UserRole)
                                }
                                className="rounded-xl border border-[#E7E4DC] bg-white px-3 py-2 text-sm text-ash outline-none transition focus:border-oren focus:ring-4 focus:ring-oren/10 disabled:cursor-not-allowed disabled:bg-slate-100"
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
            </div>
          ) : null}

          {activeTab === 'manage-surveys' ? (
            <div className="space-y-6 print:hidden">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-oren">
                    Daftar Survei
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ash">
                    Kelola Survei
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-ash/80">
                    Kelola survei aktif dan nonaktif. Klik &ldquo;Edit&rdquo; untuk mengubah pertanyaan secara detail.
                  </p>
                </div>

                <div className="flex shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-xl bg-oren-muda px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-95 cursor-pointer h-[48px]"
                  >
                    <Plus size={16} className="mr-2" />
                    Buat Survei
                  </button>
                </div>
              </div>

              {/* Tab filter: Semua / Aktif / Nonaktif */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {(['all', 'active', 'inactive'] as const).map((filter) => {
                  const labels = { all: 'Semua', active: 'Aktif', inactive: 'Nonaktif' }
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => { setActiveStatusFilter(filter); setCurrentPage(1) }}
                      className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition cursor-pointer ${
                        activeStatusFilter === filter
                          ? 'bg-oren-muda text-white'
                          : 'border border-light-grey bg-white text-ash hover:bg-light-grey/50'
                      }`}
                    >
                      {labels[filter]}
                      <span className="ml-2 rounded-xl bg-black/10 px-1.5 py-0.5 text-[11px]">
                        {filter === 'all' ? surveys.length
                          : filter === 'active' ? surveys.filter(s => s.is_active).length
                          : surveys.filter(s => !s.is_active).length}
                      </span>
                    </button>
                  )
                })}

                <button
                  type="button"
                  onClick={() => setIsSearchOpen((current) => !current)}
                  aria-label="Toggle pencarian survei"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-light-grey bg-white text-ash transition hover:bg-light-grey/50 cursor-pointer"
                >
                  <Search size={18} />
                </button>

                <div
                  className={`origin-right overflow-hidden transition-all duration-300 ease-in-out ${isSearchOpen ? 'max-w-[280px] scale-x-100 opacity-100' : 'max-w-0 scale-x-0 opacity-0'}`}
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => { setSearchQuery(event.target.value); setCurrentPage(1) }}
                    placeholder="Cari survei..."
                    className="w-[280px] rounded-xl border border-light-grey bg-white px-4 py-2.5 text-sm text-ash outline-none transition focus:border-oren-muda focus:ring-4 focus:ring-oren-muda/10"
                  />
                </div>
              </div>

              {surveysLoading ? (
                <div className="mt-5">
                  <LoadingSpinner />
                </div>
              ) : surveysError ? (
                <p className="mt-5 text-sm text-red-600">{surveysError}</p>
              ) : paginatedSurveys.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-light-grey bg-white px-5 py-10 text-center text-sm text-ash/80">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-oren-muda/10 text-oren-muda">
                    <ArchiveX size={22} />
                  </div>
                  <p className="mt-4 text-base font-semibold text-ash">
                    Tidak ada survei yang sesuai filter.
                  </p>
                  <p className="mt-2">
                    Coba ubah tab filter atau kata kunci pencarian.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {paginatedSurveys.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-xl border border-light-grey bg-white p-5 shadow-[0_4px_18px_-6px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold tracking-tight text-ash">
                            {item.title}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ash/60">
                            {/* Jumlah pertanyaan — diambil dari DB, bukan hardcoded */}
                            <span>{item.question_count} Pertanyaan</span>
                            <span className="h-4 w-px bg-light-grey" aria-hidden="true" />
                            <span>Dibuat {formatSurveyDate(item.created_at)}</span>
                            <span
                              className={`rounded-xl px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                                item.is_active
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'border border-light-grey bg-white text-ash/60'
                              }`}
                            >
                              {item.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-3 lg:justify-end">
                          {/* Toggle status Aktif / Nonaktif */}
                          <button
                            type="button"
                            onClick={() => void handleToggleSurveyStatus(item)}
                            disabled={togglingStatusId === item.id}
                            title={item.is_active ? 'Nonaktifkan survei' : 'Aktifkan survei'}
                            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-300 hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${
                              item.is_active
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-light-grey bg-white text-ash/70'
                            }`}
                          >
                            {togglingStatusId === item.id ? (
                              <span className="opacity-60">...</span>
                            ) : item.is_active ? (
                              <><ToggleRight size={16} /> Aktif</>
                            ) : (
                              <><ToggleLeft size={16} /> Nonaktif</>
                            )}
                          </button>

                          {/* Tombol Edit → pergi ke halaman edit survei */}
                          <Link
                            to={`/admin/surveys/${item.id}/edit`}
                            className="inline-flex items-center gap-2 rounded-xl bg-light-blue px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-95 cursor-pointer"
                          >
                            <ExternalLink size={15} />
                            Edit Survei
                          </Link>

                          {/* Tombol Hapus */}
                          <button
                            type="button"
                            onClick={() => setSurveyIdToDelete(item.id)}
                            disabled={deletingSurveyId === item.id}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                          >
                            <Trash2 size={15} />
                            {deletingSurveyId === item.id ? 'Menghapus...' : 'Hapus'}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}

                  {/* Kontrol Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-ash/60">
                          Menampilkan {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, visibleSurveys.length)} dari {visibleSurveys.length} survei
                        </span>
                        <select
                          value={pageSize}
                          onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}
                          className="rounded-xl border border-light-grey bg-white px-3 py-1.5 text-sm text-ash outline-none focus:border-oren"
                        >
                          <option value={10}>10 / hal</option>
                          <option value={20}>20 / hal</option>
                          <option value={50}>50 / hal</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className="rounded-xl border border-light-grey bg-white px-4 py-2 text-sm font-semibold text-ash transition hover:bg-light-grey/50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          ← Sebelumnya
                        </button>
                        <span className="text-sm font-semibold text-ash">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          type="button"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          className="rounded-xl border border-light-grey bg-white px-4 py-2 text-sm font-semibold text-ash transition hover:bg-light-grey/50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Berikutnya →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isCreateModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
                  <div className="w-full max-w-lg rounded-2xl border border-light-grey bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)] animate-scale-up">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-oren-muda/10 text-oren-muda">
                        <Plus size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold tracking-tight text-ash">
                          Buat Survei Baru
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-ash/80">
                          Masukkan judul survei baru di bawah ini untuk memulai.
                        </p>
                        
                        <form
                          onSubmit={(event) => void handleCreateSurvey(event)}
                          className="mt-4 space-y-4"
                        >
                          <label className="block text-sm font-medium text-ash">
                            Judul Survei
                            <input
                              type="text"
                              value={newSurveyTitle}
                              onChange={(event) => setNewSurveyTitle(event.target.value)}
                              placeholder="Contoh: Survei Kepuasan Layanan LPDP 2027"
                              className="mt-2 w-full rounded-xl border border-light-grey bg-white px-4 py-3 text-sm text-ash outline-none transition-shadow focus:outline-none focus:ring-2 focus:ring-oren-muda/30 focus:ring-offset-1"
                              autoFocus
                            />
                          </label>

                          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setIsCreateModalOpen(false)
                                setNewSurveyTitle('')
                              }}
                              className="inline-flex items-center justify-center rounded-xl border border-light-grey bg-white px-5 py-3 text-sm font-semibold text-ash transition hover:bg-light-grey/50 cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              disabled={creatingSurvey}
                              className="inline-flex items-center justify-center rounded-xl bg-oren-muda px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                            >
                              {creatingSurvey ? 'Membuat...' : 'Buat Survei'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {surveyIdToDelete ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
                  <div className="w-full max-w-lg rounded-2xl border border-light-grey bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)] animate-scale-up">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                        <Trash2 size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold tracking-tight text-ash">
                          Hapus kuesioner?
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-ash/80">
                          Apakah Anda yakin ingin menghapus kuesioner ini? Tindakan ini akan menghapus seluruh pertanyaan dan respons responden di dalamnya secara permanen.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setSurveyIdToDelete(null)}
                        className="inline-flex items-center justify-center rounded-xl border border-light-grey bg-white px-5 py-3 text-sm font-semibold text-ash transition hover:bg-light-grey/50 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteSurvey(surveyIdToDelete)}
                        className="inline-flex items-center justify-center rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600 cursor-pointer"
                      >
                        Ya, Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

            </div>
          ) : null}

          {activeTab === 'analytics' ? (
            <>
              <div className="mt-8 space-y-6 print:hidden">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-ash">Raw Data</h2>
                    <p className="mt-1 text-sm text-ash/80">
                      Jawaban mentah untuk analisis lanjutan atau ekspor CSV.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={exportCsv}
                      className="inline-flex items-center justify-center rounded-xl bg-oren px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-95 cursor-pointer"
                    >
                      Export CSV
                    </button>
                    <button
                      type="button"
                      onClick={handlePrintReport}
                      className="inline-flex items-center justify-center rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-95 cursor-pointer"
                    >
                      Cetak Laporan PDF
                    </button>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-xl border border-[#E7E4DC] bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#E7E4DC] text-left text-sm">
                      <thead className="bg-[#E7E4DC]/55 text-xs uppercase tracking-[0.16em] text-ash/70">
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
                      <tbody className="divide-y divide-[#E7E4DC]">
                        {csvRows.map((row) => (
                          <tr key={`${row.response_id}-${row.question_text}`}>
                            <td className="px-4 py-3 text-ash/80">{row.response_id}</td>
                            <td className="px-4 py-3 text-ash/80">{row.submitted_at}</td>
                            <td className="px-4 py-3 font-medium text-ash">{row.question_text}</td>
                            <td className="px-4 py-3 text-ash/80">{row.performance}</td>
                            <td className="px-4 py-3 text-ash/80">{row.importance}</td>
                            <td className="px-4 py-3 text-ash/80">{row.reason || '-'}</td>
                            <td className="px-4 py-3 text-ash/80">
                              {quadrantMap.get(row.question_id) ?? '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </>
      )}
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
    <ResponsiveContainer width="100%" height="100%"
    >
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" dataKey="performance" name="Performance" domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
        <YAxis type="number" dataKey="importance" name="Importance" domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
        <ReferenceLine x={meanPerformance} stroke="#DE7A49" strokeDasharray="4 4" />
        <ReferenceLine y={meanImportance} stroke="#1C4999" strokeDasharray="4 4" />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter data={data} fill="#BD5B2C" />
      </ScatterChart>
    </ResponsiveContainer>
  )
}

export default DashboardPage
