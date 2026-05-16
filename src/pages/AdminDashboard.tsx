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

function AdminDashboard() {
  const navigate = useNavigate()
  const [survey, setSurvey] = useState<SurveyRow | null>(null)
  const [responses, setResponses] = useState<ResponseWithAnswers[]>([])
  const [selectedProvince, setSelectedProvince] = useState('all')
  const [activeTab, setActiveTab] = useState<'analytics' | 'critical-feedback' | 'users'>('analytics')
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null)

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

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f8fbff_0%,_#eef4fb_100%)] px-4 py-10 text-slate-900 print:bg-white print:px-0 print:py-0 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(0,51,102,0.08)] print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none sm:p-8">
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
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-full border border-[#003366] bg-white px-5 py-3 text-sm font-semibold text-[#003366] transition hover:bg-slate-50"
              >
                Kembali ke Landing Page
              </Link>
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
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 print:hidden"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="mt-6 inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 print:hidden">
            {[
              { key: 'analytics', label: 'Analytics' },
              { key: 'critical-feedback', label: 'Critical Feedback' },
              { key: 'users', label: 'User Management' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.key
                    ? 'bg-[#003366] text-white shadow-[0_10px_24px_rgba(0,51,102,0.18)]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
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

                  <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] print:block print:gap-0">
                    <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 sm:p-6 print:rounded-none print:border-0 print:bg-white print:p-0 print:break-inside-avoid">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between print:block">
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900">IPA Scatter Plot</h2>
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
                              className="mt-2 w-full min-w-[220px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/10"
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

                    <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 sm:p-6 print:mt-4 print:rounded-none print:border-0 print:bg-white print:p-0 print:break-inside-avoid">
                      <h2 className="text-lg font-semibold text-slate-900">Ringkasan Kuadran</h2>
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
                    <h2 className="text-lg font-semibold text-slate-900">
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
                          className={`rounded-[1.5rem] border p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] print:shadow-none ${toneClasses}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${titleClasses}`}>
                                {quadrant.label}
                              </p>
                              <h3 className="mt-2 text-base font-semibold text-slate-900">
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
                <section className="mt-8 rounded-[2rem] border border-slate-200 bg-slate-50 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Critical Feedback</h2>
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
                          className="rounded-[1.5rem] border border-amber-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F97316]">
                                Question Text
                              </p>
                              <h3 className="mt-2 text-base font-semibold text-slate-900">
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
                    <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-8 text-center">
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
                <section className="mt-8 rounded-[2rem] border border-slate-200 bg-slate-50 p-5 sm:p-6 print:hidden">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">User Management</h2>
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
                    <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
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

              {activeTab === 'analytics' ? (
                <>
                  <section className="mt-8 rounded-[2rem] border border-slate-200 bg-slate-50 p-5 sm:p-6 print:hidden">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">Raw Data</h2>
                        <p className="mt-1 text-sm text-slate-600">
                          Jawaban mentah untuk analisis lanjutan atau ekspor CSV.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={exportCsv}
                          className="inline-flex items-center justify-center rounded-full bg-[#F97316] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#ff8a3d]"
                        >
                          Export CSV
                        </button>
                        <button
                          type="button"
                          onClick={handlePrintReport}
                          className="inline-flex items-center justify-center rounded-full bg-[#003366] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0a447f]"
                        >
                          Cetak Laporan PDF
                        </button>
                      </div>
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
              ) : null}
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