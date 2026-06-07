/**
 * EditSurveyPage.tsx
 *
 * Halaman khusus untuk mengedit survei, sections, dan pertanyaan.
 * Fitur:
 *  - Edit judul survei
 *  - Tambah / edit / hapus section
 *  - Ubah urutan section (tombol ↑ / ↓)
 *  - Tambah / edit / hapus pertanyaan per section
 *  - Ubah urutan pertanyaan (tombol ↑ / ↓)
 *  - Edit tipe pertanyaan dengan peringatan jika ada data
 */

import { useEffect, useState, type FormEvent } from 'react'


import { useDebounce } from '../../hooks/useDebounce'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import { supabase } from '../../lib/supabase'
import type { SectionRow, SurveyRow, QuestionRow } from '../../types/database'
import { toast } from 'sonner'

// ─── Tipe pertanyaan yang didukung ───────────────────────────────────────────
type QuestionType =
  | 'dual_likert'
  | 'text'
  | 'short_text'
  | 'long_text'
  | 'checkbox'
  | 'dropdown'
  | 'multiple_choice'
  | 'true_false'

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  dual_likert: 'Matriks IPA / Dual Likert',
  text: 'Isian Bebas / Esai (Lama)',
  short_text: 'Jawaban Singkat',
  long_text: 'Jawaban Panjang',
  checkbox: 'Kotak Centang (Banyak Pilihan)',
  dropdown: 'Dropdown',
  multiple_choice: 'Pilihan Ganda',
  true_false: 'Benar / Salah',
}

const CHOICE_TYPES: QuestionType[] = ['checkbox', 'dropdown', 'multiple_choice']

// ─── Tipe lokal ──────────────────────────────────────────────────────────────
type SectionWithQuestions = SectionRow & {
  questions: QuestionRow[]
}

// ─── Helper ──────────────────────────────────────────────────────────────────
function formatQuestionType(type: string): string {
  return QUESTION_TYPE_LABELS[type as QuestionType] ?? type
}

function optionsToString(options: unknown): string {
  if (!options) return ''
  if (Array.isArray(options)) return options.join(', ')
  return ''
}

function stringToOptions(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

// ─── Komponen utama ───────────────────────────────────────────────────────────
export default function EditSurveyPage() {
  const { id: surveyId } = useParams<{ id: string }>()

  const [survey, setSurvey] = useState<SurveyRow | null>(null)
  const [sections, setSections] = useState<SectionWithQuestions[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State untuk edit judul survei
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  // State untuk tambah section baru
  const [isAddingSectionOpen, setIsAddingSectionOpen] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [addingSection, setAddingSection] = useState(false)

  // State untuk edit section (inline per section)
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editingSectionTitle, setEditingSectionTitle] = useState('')
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null)

  // State untuk tambah pertanyaan baru
  type AddQuestionState = {
    sectionId: string
    text: string
    type: QuestionType
    required: boolean
    optionsText: string
  }
  const [addingQuestion, setAddingQuestion] = useState<AddQuestionState | null>(null)
  const [creatingQuestion, setCreatingQuestion] = useState(false)

  // State untuk edit pertanyaan
  type EditQuestionState = {
    questionId: string
    text: string
    type: QuestionType
    required: boolean
    optionsText: string
  }
  const [editingQuestion, setEditingQuestion] = useState<EditQuestionState | null>(null)
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null)

  // Konfirmasi hapus
  const [confirmDeleteSection, setConfirmDeleteSection] = useState<string | null>(null)
  const [confirmDeleteQuestion, setConfirmDeleteQuestion] = useState<string | null>(null)
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Warning saat ganti tipe pertanyaan yang sudah punya data
  const [typeChangeWarning, setTypeChangeWarning] = useState<{
    questionId: string
    newType: QuestionType
  } | null>(null)

  // ── Load data ──────────────────────────────────────────────────────────────
  async function loadData() {
    if (!surveyId) return

    setLoading(true)
    setError(null)

    try {
      const { data: surveyData, error: surveyError } = await supabase
        .from('surveys')
        .select('id, title, is_active, created_at')
        .eq('id', surveyId)
        .maybeSingle()

      if (surveyError) throw new Error(surveyError.message)
      if (!surveyData) throw new Error('Survei tidak ditemukan.')

      const surveyRow = surveyData as SurveyRow

      setSurvey(surveyRow)
      setTitleDraft(surveyRow.title)

      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('id, survey_id, title, description, order_index, created_at')
        .eq('survey_id', surveyId)
        .order('order_index', { ascending: true })

      if (sectionsError) throw new Error(sectionsError.message)

      const rawSections = (sectionsData ?? []) as SectionRow[]

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select(
          'id, survey_id, section_id, question_text, question_type, options, is_required, branching_logic, order_index',
        )
        .eq('survey_id', surveyId)
        .order('order_index', { ascending: true })

      if (questionsError) throw new Error(questionsError.message)

      const allQuestions = (questionsData ?? []) as QuestionRow[]

      const merged: SectionWithQuestions[] = rawSections.map((section) => ({
        ...section,
        questions: allQuestions.filter((q) => q.section_id === section.id),
      }))

      const orphanQuestions = allQuestions.filter((q) => !q.section_id)
      if (orphanQuestions.length > 0) {
        merged.push({
          id: '__orphan__',
          survey_id: surveyId,
          title: 'Tanpa Bagian',
          description: null,
          order_index: 9999,
          created_at: '',
          questions: orphanQuestions,
        })
      }

      setSections(merged)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyId])

  // ── Autosave Judul Survei ──────────────────────────────────────────────────
  const debouncedTitle = useDebounce(titleDraft, 1000)

  useEffect(() => {
    if (survey && debouncedTitle && debouncedTitle !== survey.title) {
      void saveTitleAuto(debouncedTitle)
    }
  }, [debouncedTitle])

  async function saveTitleAuto(newTitle: string) {
    setSaveStatus('saving')
    const { error: updateError } = await (supabase.from('surveys') as any)
      .update({ title: newTitle })
      .eq('id', survey!.id)

    if (updateError) {
      setSaveStatus('error')
      toast.error(updateError.message)
    } else {
      setSurvey((prev) => (prev ? { ...prev, title: newTitle } : prev))
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  // ── Tambah section ─────────────────────────────────────────────────────────
  async function handleAddSection(e: FormEvent) {
    e.preventDefault()
    const title = newSectionTitle.trim()
    if (!title || !surveyId) return

    setAddingSection(true)
    const nextOrder = sections.filter((s) => s.id !== '__orphan__').length

    const { error: insertError } = await (supabase.from('sections') as any).insert([
      { survey_id: surveyId, title, order_index: nextOrder },
    ])

    if (insertError) {
      toast.error(insertError.message)
    } else {
      setNewSectionTitle('')
      setIsAddingSectionOpen(false)
      toast.success('Bagian baru berhasil ditambahkan.')
      await loadData()
    }
    setAddingSection(false)
  }

  // ── Autosave Edit Section Title ────────────────────────────────────────────
  function startEditSection(section: SectionWithQuestions) {
    setEditingSectionId(section.id)
    setEditingSectionTitle(section.title)
  }

  const debouncedSectionTitle = useDebounce(editingSectionTitle, 1000)

  useEffect(() => {
    if (editingSectionId && debouncedSectionTitle) {
      const original = sections.find(s => s.id === editingSectionId)?.title
      if (original && original !== debouncedSectionTitle) {
        void saveSectionAuto(editingSectionId, debouncedSectionTitle)
      }
    }
  }, [debouncedSectionTitle])

  async function saveSectionAuto(sectionId: string, newTitle: string) {
    setSaveStatus('saving')
    const { error: updateError } = await (supabase.from('sections') as any)
      .update({ title: newTitle })
      .eq('id', sectionId)

    if (updateError) {
      setSaveStatus('error')
      toast.error(updateError.message)
    } else {
      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, title: newTitle } : s)),
      )
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  function handleFinishEditSection(e: FormEvent) {
    e.preventDefault()
    setEditingSectionId(null)
  }

  // ── Hapus section ──────────────────────────────────────────────────────────
  async function handleDeleteSection(sectionId: string) {
    setConfirmDeleteSection(null)
    setDeletingSectionId(sectionId)

    const { error: deleteError } = await supabase
      .from('sections')
      .delete()
      .eq('id', sectionId)

    if (deleteError) {
      toast.error(deleteError.message)
    } else {
      toast.success('Bagian berhasil dihapus.')
      await loadData()
    }
    setDeletingSectionId(null)
  }

  // ── Ubah urutan section ────────────────────────────────────────────────────
  async function moveSectionOrder(sectionId: string, direction: 'up' | 'down') {
    const realSections = sections.filter((s) => s.id !== '__orphan__')
    const idx = realSections.findIndex((s) => s.id === sectionId)
    if (idx === -1) return

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= realSections.length) return

    const current = realSections[idx]
    const target = realSections[targetIdx]

    const updates = [
      (supabase.from('sections') as any).update({ order_index: target.order_index }).eq('id', current.id),
      (supabase.from('sections') as any).update({ order_index: current.order_index }).eq('id', target.id),
    ]

    const results = await Promise.all(updates)
    const hasError = results.some((r) => r.error)

    if (hasError) {
      toast.error('Gagal mengubah urutan bagian.')
    } else {
      await loadData()
    }
  }

  // ── Tambah pertanyaan ──────────────────────────────────────────────────────
  function startAddQuestion(sectionId: string) {
    setAddingQuestion({
      sectionId,
      text: '',
      type: 'dual_likert',
      required: true,
      optionsText: '',
    })
  }

  async function handleCreateQuestion(e: FormEvent) {
    e.preventDefault()
    if (!addingQuestion || !surveyId) return

    const { sectionId, text, type, required, optionsText } = addingQuestion
    const trimmedText = text.trim()

    if (!trimmedText) {
      toast.error('Teks pertanyaan wajib diisi.')
      return
    }

    const isChoiceType = CHOICE_TYPES.includes(type)
    const options = isChoiceType ? stringToOptions(optionsText) : null

    if (isChoiceType && (!options || options.length === 0)) {
      toast.error('Wajib mengisi minimal satu pilihan.')
      return
    }

    const sectionData = sections.find((s) => s.id === sectionId)
    const nextOrder = sectionData?.questions.length ?? 0

    const branchingLogic =
      type === 'dual_likert'
        ? {
            show_reason_if: {
              field: 'score_performance',
              operator: '<',
              value: 3,
              target: 'reason',
            },
          }
        : null

    setCreatingQuestion(true)
    const { error: insertError } = await (supabase.from('questions') as any).insert([
      {
        survey_id: surveyId,
        section_id: sectionId === '__orphan__' ? null : sectionId,
        question_text: trimmedText,
        question_type: type,
        is_required: required,
        options: options,
        branching_logic: branchingLogic,
        order_index: nextOrder,
      },
    ])

    if (insertError) {
      toast.error(insertError.message)
    } else {
      setAddingQuestion(null)
      toast.success('Pertanyaan baru berhasil ditambahkan.')
      await loadData()
    }
    setCreatingQuestion(false)
  }

  // ── Edit pertanyaan ────────────────────────────────────────────────────────
  function startEditQuestion(question: QuestionRow) {
    setEditingQuestion({
      questionId: question.id,
      text: question.question_text,
      type: question.question_type as QuestionType,
      required: question.is_required,
      optionsText: optionsToString(question.options),
    })
  }

  async function handleTypeChange(questionId: string, newType: QuestionType) {
    if (!editingQuestion || editingQuestion.questionId !== questionId) return

    const currentType = editingQuestion.type
    if (currentType === newType) return

    const { count } = await supabase
      .from('answers')
      .select('id', { count: 'exact', head: true })
      .eq('question_id', questionId)

    if ((count ?? 0) > 0) {
      setTypeChangeWarning({ questionId, newType })
    } else {
      setEditingQuestion((prev) =>
        prev ? { ...prev, type: newType, optionsText: '' } : prev,
      )
    }
  }

  function confirmTypeChange() {
    if (!typeChangeWarning || !editingQuestion) return
    setEditingQuestion((prev) =>
      prev ? { ...prev, type: typeChangeWarning.newType, optionsText: '' } : prev,
    )
    setTypeChangeWarning(null)
  }

  // ── Autosave Edit Pertanyaan ───────────────────────────────────────────────
  const debouncedEditingQuestion = useDebounce(editingQuestion, 1000)

  useEffect(() => {
    if (debouncedEditingQuestion) {
      let original: QuestionRow | undefined
      for (const s of sections) {
        const found = s.questions.find(q => q.id === debouncedEditingQuestion.questionId)
        if (found) {
          original = found
          break
        }
      }
      
      if (original) {
        const isChoiceType = CHOICE_TYPES.includes(debouncedEditingQuestion.type)
        const oldOptionsText = optionsToString(original.options)
        
        if (
          original.question_text !== debouncedEditingQuestion.text ||
          original.question_type !== debouncedEditingQuestion.type ||
          original.is_required !== debouncedEditingQuestion.required ||
          (isChoiceType && oldOptionsText !== debouncedEditingQuestion.optionsText)
        ) {
          void saveQuestionAuto(debouncedEditingQuestion)
        }
      }
    }
  }, [debouncedEditingQuestion])

  async function saveQuestionAuto(editedQ: EditQuestionState) {
    const trimmedText = editedQ.text.trim()
    if (!trimmedText) return

    const isChoiceType = CHOICE_TYPES.includes(editedQ.type)
    const options = isChoiceType ? stringToOptions(editedQ.optionsText) : null
    
    if (isChoiceType && (!options || options.length === 0)) return

    const branchingLogic =
      editedQ.type === 'dual_likert'
        ? {
            show_reason_if: {
              field: 'score_performance',
              operator: '<',
              value: 3,
              target: 'reason',
            },
          }
        : null

    setSaveStatus('saving')
    const { error: updateError } = await (supabase.from('questions') as any)
      .update({
        question_text: trimmedText,
        question_type: editedQ.type,
        is_required: editedQ.required,
        options: options,
        branching_logic: branchingLogic,
      })
      .eq('id', editedQ.questionId)

    if (updateError) {
      setSaveStatus('error')
      toast.error(updateError.message)
    } else {
      setSections((prev) =>
        prev.map((s) => ({
          ...s,
          questions: s.questions.map((q) =>
            q.id === editedQ.questionId
              ? {
                  ...q,
                  question_text: trimmedText,
                  question_type: editedQ.type,
                  is_required: editedQ.required,
                  options: options,
                  branching_logic: branchingLogic,
                }
              : q,
          ),
        })),
      )
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  function handleFinishEditQuestion(e: FormEvent) {
    e.preventDefault()
    setEditingQuestion(null)
  }

  // ── Hapus pertanyaan ───────────────────────────────────────────────────────
  async function handleDeleteQuestion(questionId: string) {
    setConfirmDeleteQuestion(null)
    setDeletingQuestionId(questionId)

    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId)

    if (deleteError) {
      toast.error(deleteError.message)
    } else {
      toast.success('Pertanyaan berhasil dihapus.')
      await loadData()
    }
    setDeletingQuestionId(null)
  }

  // ── Ubah urutan pertanyaan ─────────────────────────────────────────────────
  async function moveQuestionOrder(
    sectionId: string,
    questionId: string,
    direction: 'up' | 'down',
  ) {
    const section = sections.find((s) => s.id === sectionId)
    if (!section) return

    const questions = section.questions
    const idx = questions.findIndex((q) => q.id === questionId)
    if (idx === -1) return

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= questions.length) return

    const current = questions[idx]
    const target = questions[targetIdx]

    const updates = [
      (supabase.from('questions') as any).update({ order_index: target.order_index }).eq('id', current.id),
      (supabase.from('questions') as any).update({ order_index: current.order_index }).eq('id', target.id),
    ]

    const results = await Promise.all(updates)
    const hasError = results.some((r) => r.error)

    if (hasError) {
      toast.error('Gagal mengubah urutan pertanyaan.')
    } else {
      await loadData()
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !survey) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">{error ?? 'Survei tidak ditemukan.'}</p>
        <Link
          to="/admin/surveys"
          className="inline-flex items-center gap-2 text-sm font-semibold text-oren hover:underline"
        >
          <ArrowLeft size={16} />
          Kembali ke Daftar Survei
        </Link>
      </div>
    )
  }

  const realSections = sections.filter((s) => s.id !== '__orphan__')

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link
            to="/admin/surveys"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ash/60 transition hover:text-ash"
          >
            <ArrowLeft size={15} />
            Kembali ke Daftar Survei
          </Link>

          <div className="flex items-center gap-4 mt-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-oren">
              Edit Survei
            </p>
            {/* Status Autosave */}
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-xl transition-opacity ${
              saveStatus === 'saving' ? 'bg-amber-100 text-amber-800 opacity-100' :
              saveStatus === 'saved' ? 'bg-emerald-100 text-emerald-800 opacity-100' :
              saveStatus === 'error' ? 'bg-red-100 text-red-800 opacity-100' :
              'opacity-0'
            }`}>
              {saveStatus === 'saving' ? 'Menyimpan...' : 
               saveStatus === 'saved' ? 'Semua perubahan tersimpan' : 
               saveStatus === 'error' ? 'Gagal menyimpan' : ''}
            </span>
          </div>

          {/* Judul survei — bisa diedit langsung */}
          {isEditingTitle ? (
            <div className="mt-2 flex items-center gap-3">
              <input
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                className="w-full max-w-lg rounded-xl border border-light-grey bg-white px-4 py-2.5 text-2xl font-semibold tracking-tight text-ash outline-none transition focus:border-oren focus:ring-4 focus:ring-oren/10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setIsEditingTitle(false)}
                className="inline-flex items-center gap-2 rounded-xl bg-oren-muda px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95"
              >
                <Save size={15} />
                Selesai
              </button>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-ash sm:text-3xl">
                {survey.title}
              </h1>
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                className="rounded-xl border border-light-grey bg-white p-2 text-ash/50 transition hover:bg-light-grey/50 hover:text-ash"
                title="Edit judul survei"
              >
                <Pencil size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="flex shrink-0 gap-3">
          <Link
            to={`/survey/${survey.id}?preview=true`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl border border-light-grey bg-white px-5 py-3 text-sm font-semibold text-ash/80 transition hover:bg-light-grey/50"
          >
            Preview Survei
          </Link>
          <Link
            to="/admin/surveys"
            className="inline-flex h-[48px] cursor-pointer items-center justify-center rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-95"
          >
            Selesai Edit
          </Link>
        </div>
      </div>

      {/* ── Form tambah section baru ── */}
      {isAddingSectionOpen && (
        <div className="rounded-xl border border-oren/30 bg-oren/5 p-5">
          <form onSubmit={(e) => void handleAddSection(e)} className="flex items-end gap-4">
            <label className="flex-1 block text-sm font-medium text-ash">
              Nama Bagian Baru
              <input
                type="text"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="Contoh: Data Diri, Evaluasi Layanan..."
                className="mt-2 w-full rounded-xl border border-light-grey bg-white px-4 py-3 text-sm text-ash outline-none transition focus:border-oren focus:ring-4 focus:ring-oren/10"
                autoFocus
              />
            </label>
            <button
              type="submit"
              disabled={addingSection}
              className="inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-60 h-[48px]"
            >
              <Save size={15} />
              {addingSection ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingSectionOpen(false)
                setNewSectionTitle('')
              }}
              className="rounded-xl border border-light-grey bg-white p-3 text-ash/60 transition hover:bg-light-grey/50 h-[48px]"
            >
              <X size={16} />
            </button>
          </form>
        </div>
      )}

      {/* ── Daftar sections ── */}
      {sections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-light-grey bg-white px-5 py-12 text-center text-sm text-ash/60">
          Belum ada bagian. Klik &ldquo;Tambah Bagian&rdquo; untuk memulai.
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section, sectionIdx) => {
            const isOrphan = section.id === '__orphan__'
            const isFirst = !isOrphan && sectionIdx === 0
            const isLast = !isOrphan && sectionIdx === realSections.length - 1
            const isEditingThisSection = editingSectionId === section.id

            return (
              <div
                key={section.id}
                className="overflow-hidden rounded-xl border border-light-grey bg-white shadow-[0_4px_18px_-6px_rgba(0,0,0,0.08)]"
              >
                {/* Section header */}
                <div className="flex items-center gap-3 border-b border-light-grey bg-[#F5F3EE] px-5 py-4">
                  {!isOrphan && (
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => void moveSectionOrder(section.id, 'up')}
                        title="Pindah ke atas"
                        className="rounded-lg border border-light-grey bg-white p-1 text-ash/40 transition hover:bg-light-grey/50 hover:text-ash disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => void moveSectionOrder(section.id, 'down')}
                        title="Pindah ke bawah"
                        className="rounded-lg border border-light-grey bg-white p-1 text-ash/40 transition hover:bg-light-grey/50 hover:text-ash disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {isEditingThisSection && !isOrphan ? (
                      <form
                        onSubmit={(e) => void handleFinishEditSection(e)}
                        className="flex flex-1 items-center gap-3"
                      >
                        <input
                          type="text"
                          value={editingSectionTitle}
                          onChange={(e) => setEditingSectionTitle(e.target.value)}
                          className="w-full max-w-sm rounded-xl border border-light-grey bg-white px-3 py-2 text-sm font-semibold text-ash outline-none transition focus:border-oren focus:ring-4 focus:ring-oren/10"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-xl bg-oren-muda px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110 active:scale-95"
                        >
                          <Save size={14} />
                          Selesai
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-oren">
                          Bagian
                        </span>
                        <h2 className="text-base font-semibold tracking-tight text-ash">
                          {section.title}
                        </h2>
                      </div>
                    )}
                  </div>

                  {!isOrphan && !isEditingThisSection && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditSection(section)}
                        className="rounded-lg border border-light-grey bg-white p-1.5 text-ash/50 transition hover:bg-light-grey/50 hover:text-ash"
                        title="Edit nama bagian"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteSection(section.id)}
                        disabled={deletingSectionId === section.id}
                        className="rounded-lg border border-red-100 bg-red-50 p-1.5 text-red-500 transition hover:bg-red-100 disabled:opacity-60"
                        title="Hapus bagian"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Daftar pertanyaan */}
                <div className="divide-y divide-light-grey">
                  {section.questions.map((question, qIdx) => {
                    const isEditingThis = editingQuestion?.questionId === question.id
                    
                    return (
                      <div key={question.id} className="px-5 py-4">
                        {isEditingThis ? (
                          <form onSubmit={(e) => void handleFinishEditQuestion(e)} className="space-y-4">
                            <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.5fr]">
                              <input
                                type="text"
                                value={editingQuestion.text}
                                onChange={(e) => setEditingQuestion((prev) => prev ? { ...prev, text: e.target.value } : prev)}
                                className="w-full rounded-xl border border-light-grey bg-white px-4 py-3 text-sm text-ash outline-none transition focus:border-oren focus:ring-2 focus:ring-oren/10"
                              />
                              <select
                                value={editingQuestion.type}
                                onChange={(e) => void handleTypeChange(question.id, e.target.value as QuestionType)}
                                className="w-full rounded-xl border border-light-grey bg-white px-4 py-3 text-sm text-ash outline-none transition focus:border-oren focus:ring-2 focus:ring-oren/10"
                              >
                                {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((type) => (
                                  <option key={type} value={type}>{QUESTION_TYPE_LABELS[type]}</option>
                                ))}
                              </select>
                              <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-oren-muda px-4 text-xs font-semibold text-white transition hover:brightness-110 active:scale-95">
                                <Save size={14} /> Selesai
                              </button>
                            </div>
                          </form>
                        ) : (
                          /* ── Tampilan pertanyaan normal ── */
                          <div className="flex items-start gap-4">
                            {/* Tombol urutan pertanyaan */}
                            <div className="flex flex-col gap-1 pt-0.5">
                              <button
                                type="button"
                                disabled={qIdx === 0}
                                onClick={() =>
                                  void moveQuestionOrder(section.id, question.id, 'up')
                                }
                                title="Pindah ke atas"
                                className="rounded-lg border border-light-grey bg-white p-1 text-ash/30 transition hover:bg-light-grey/50 hover:text-ash disabled:cursor-not-allowed disabled:opacity-20"
                              >
                                <ChevronUp size={13} />
                              </button>
                              <button
                                type="button"
                                disabled={qIdx === section.questions.length - 1}
                                onClick={() =>
                                  void moveQuestionOrder(section.id, question.id, 'down')
                                }
                                title="Pindah ke bawah"
                                className="rounded-lg border border-light-grey bg-white p-1 text-ash/30 transition hover:bg-light-grey/50 hover:text-ash disabled:cursor-not-allowed disabled:opacity-20"
                              >
                                <ChevronDown size={13} />
                              </button>
                            </div>

                            {/* Nomor urut */}
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy/10 text-xs font-bold text-navy">
                              {qIdx + 1}
                            </div>

                            {/* Konten pertanyaan */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-ash leading-snug">
                                {question.question_text}
                              </p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <span className="rounded-xl bg-butter/45 px-2.5 py-0.5 text-xs font-semibold text-ash/80">
                                  {formatQuestionType(question.question_type)}
                                </span>
                                <span
                                  className={`rounded-xl px-2.5 py-0.5 text-xs font-semibold ${
                                    question.is_required
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {question.is_required ? 'Wajib' : 'Opsional'}
                                </span>
                              </div>
                            </div>

                            {/* Tombol aksi pertanyaan */}
                            <div className="flex shrink-0 items-center gap-2">
                              <button
                                type="button"
                                onClick={() => startEditQuestion(question)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-light-grey bg-white px-3 py-1.5 text-xs font-semibold text-ash/70 transition hover:bg-light-grey/50 hover:text-ash"
                              >
                                <Pencil size={12} />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteQuestion(question.id)}
                                disabled={deletingQuestionId === question.id}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                              >
                                <Trash2 size={12} />
                                {deletingQuestionId === question.id ? '...' : 'Hapus'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Tombol tambah pertanyaan ke section ini */}
                {!isOrphan && (
                  <div className="border-t border-light-grey bg-[#FAFAF8] px-5 py-3">
                    {addingQuestion?.sectionId === section.id ? (
                      <form onSubmit={(e) => void handleCreateQuestion(e)} className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
                          <input
                            type="text"
                            value={addingQuestion.text}
                            onChange={(e) =>
                              setAddingQuestion((prev) =>
                                prev ? { ...prev, text: e.target.value } : prev,
                              )
                            }
                            placeholder="Teks pertanyaan baru..."
                            className="w-full rounded-xl border border-light-grey bg-white px-4 py-3 text-sm text-ash outline-none transition focus:border-oren focus:ring-2 focus:ring-oren/10 h-[48px]"
                            autoFocus
                          />
                          <label className="block">
                            <select
                              value={addingQuestion.type}
                              onChange={(e) =>
                                setAddingQuestion((prev) =>
                                  prev ? { ...prev, type: e.target.value as QuestionType } : prev,
                                )
                              }
                              className="h-[48px] rounded-xl border border-light-grey bg-white px-4 py-3 text-sm text-ash outline-none transition focus:border-oren focus:ring-2 focus:ring-oren/10"
                            >
                              {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((type) => (
                                <option key={type} value={type}>{QUESTION_TYPE_LABELS[type]}</option>
                              ))}
                            </select>
                          </label>
                          <div className="flex items-end">
                            <label className="flex cursor-pointer select-none items-center gap-2 rounded-xl border border-light-grey bg-white px-4 py-3 text-sm font-medium text-ash w-full h-[48px]">
                              <input
                                type="checkbox"
                                checked={addingQuestion.required}
                                onChange={(e) =>
                                  setAddingQuestion((prev) =>
                                    prev ? { ...prev, required: e.target.checked } : prev,
                                  )
                                }
                                className="h-4 w-4 text-navy"
                              />
                              Wajib
                            </label>
                          </div>
                          <div className="flex items-end gap-2">
                            <button
                              type="submit"
                              disabled={creatingQuestion}
                              className="inline-flex items-center justify-center rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-60 h-[48px]"
                            >
                              {creatingQuestion ? '...' : 'Tambah'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setAddingQuestion(null)}
                              className="rounded-xl border border-light-grey bg-white p-3 text-ash/60 transition hover:bg-light-grey/50 h-[48px]"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>

                        {CHOICE_TYPES.includes(addingQuestion.type) && (
                          <label className="block text-sm font-medium text-ash">
                            Pilihan Jawaban{' '}
                            <span className="text-ash/50">(pisahkan dengan koma)</span>
                            <input
                              type="text"
                              value={addingQuestion.optionsText}
                              onChange={(e) =>
                                setAddingQuestion((prev) =>
                                  prev ? { ...prev, optionsText: e.target.value } : prev,
                                )
                              }
                              placeholder="Contoh: Sangat Puas, Cukup Puas, Tidak Puas"
                              className="mt-2 w-full rounded-xl border border-light-grey bg-white px-4 py-3 text-sm text-ash outline-none transition focus:border-oren focus:ring-2 focus:ring-oren/10"
                            />
                          </label>
                        )}
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startAddQuestion(section.id)}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-ash/50 transition hover:text-oren"
                      >
                        <Plus size={15} />
                        Tambah Pertanyaan
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Tombol Tambah Bagian Baru ── */}
      {!isAddingSectionOpen && (
        <button
          type="button"
          onClick={() => setIsAddingSectionOpen(true)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-light-grey bg-white px-6 py-4 text-sm font-semibold text-ash/60 transition hover:border-oren hover:bg-oren/5 hover:text-oren"
        >
          <Plus size={16} />
          Tambah Bagian Baru
        </button>
      )}

      {/* ── Modal konfirmasi hapus section ── */}
      {confirmDeleteSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-light-grey bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 size={18} />
              </div>
              <div>
                <h3 className="text-base font-semibold tracking-tight text-ash">
                  Hapus bagian ini?
                </h3>
                <p className="mt-2 text-sm leading-6 text-ash/70">
                  Semua pertanyaan dalam bagian ini akan kehilangan pengelompokan (section_id
                  diset null). Data pertanyaan dan jawaban tetap tersimpan.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmDeleteSection(null)}
                className="inline-flex items-center justify-center rounded-xl border border-light-grey bg-white px-5 py-2.5 text-sm font-semibold text-ash transition hover:bg-light-grey/50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteSection(confirmDeleteSection)}
                className="inline-flex items-center justify-center rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Ya, Hapus Bagian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal konfirmasi hapus pertanyaan ── */}
      {confirmDeleteQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-light-grey bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 size={18} />
              </div>
              <div>
                <h3 className="text-base font-semibold tracking-tight text-ash">
                  Hapus pertanyaan ini?
                </h3>
                <p className="mt-2 text-sm leading-6 text-ash/70">
                  Pertanyaan akan dihapus permanen beserta seluruh jawabannya. Tindakan ini tidak
                  dapat dibatalkan.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmDeleteQuestion(null)}
                className="inline-flex items-center justify-center rounded-xl border border-light-grey bg-white px-5 py-2.5 text-sm font-semibold text-ash transition hover:bg-light-grey/50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteQuestion(confirmDeleteQuestion)}
                className="inline-flex items-center justify-center rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Ya, Hapus Pertanyaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal peringatan ganti tipe pertanyaan ── */}
      {typeChangeWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="text-base font-semibold tracking-tight text-ash">
                  Pertanyaan ini sudah memiliki jawaban
                </h3>
                <p className="mt-2 text-sm leading-6 text-ash/70">
                  Mengubah tipe pertanyaan ke{' '}
                  <strong>{QUESTION_TYPE_LABELS[typeChangeWarning.newType]}</strong> tidak akan
                  menghapus jawaban lama — namun jawaban tersebut mungkin tidak lagi relevan
                  dengan format baru. Apakah Anda tetap ingin melanjutkan?
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setTypeChangeWarning(null)}
                className="inline-flex items-center justify-center rounded-xl border border-light-grey bg-white px-5 py-2.5 text-sm font-semibold text-ash transition hover:bg-light-grey/50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmTypeChange}
                className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
              >
                Ya, Ubah Tipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
