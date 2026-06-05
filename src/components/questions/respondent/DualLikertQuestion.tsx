interface AnswerDraft {
  scoreImportance: string
  scorePerformance: string
  reason: string
}

interface QuestionProps {
  question: any
  value: AnswerDraft
  onChange: (patch: Partial<AnswerDraft>) => void
  preview?: boolean
}

export default function DualLikertQuestion({ question, value, onChange, preview = false }: QuestionProps) {
  const likertValues = [1, 2, 3, 4, 5]
  
  const scorePerformanceVal = Number(value?.scorePerformance)
  const showReason = Number.isFinite(scorePerformanceVal) && scorePerformanceVal < 3

  return (
    <div className="mt-5 space-y-4">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="grid grid-cols-[1fr_repeat(5,minmax(0,1fr))] gap-px bg-slate-200 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          <div className="bg-slate-50 px-4 py-3">Dimensi</div>
          {likertValues.map((val) => (
            <div key={val} className="bg-slate-50 px-2 py-3 text-center">
              {val}
            </div>
          ))}
        </div>

        {/* Importance Row */}
        <div className="grid grid-cols-[1fr_repeat(5,minmax(0,1fr))] gap-px bg-slate-200">
          <div className="bg-white px-4 py-4 text-sm font-medium text-slate-900">
            Kepentingan
          </div>
          {likertValues.map((val) => (
            <label
              key={`importance-${val}`}
              className="flex items-center justify-center bg-white px-2 py-4"
            >
              <input
                type="radio"
                name={`importance-${question?.id}`}
                value={val}
                checked={value?.scoreImportance === String(val)}
                onChange={() => onChange({ scoreImportance: String(val) })}
                disabled={preview}
                className="h-4 w-4 border-slate-300 text-oren-muda focus:ring-oren-muda opacity-80"
              />
            </label>
          ))}
        </div>

        {/* Performance Row */}
        <div className="grid grid-cols-[1fr_repeat(5,minmax(0,1fr))] gap-px bg-slate-200">
          <div className="bg-white px-4 py-4 text-sm font-medium text-slate-900">
            Kepuasan
          </div>
          {likertValues.map((val) => (
            <label
              key={`performance-${val}`}
              className="flex items-center justify-center bg-white px-2 py-4"
            >
              <input
                type="radio"
                name={`performance-${question?.id}`}
                value={val}
                checked={value?.scorePerformance === String(val)}
                onChange={() => onChange({ scorePerformance: String(val) })}
                disabled={preview}
                className="h-4 w-4 border-slate-300 text-oren-muda focus:ring-oren-muda opacity-80"
              />
            </label>
          ))}
        </div>
      </div>

      {showReason ? (
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor={`reason-${question?.id}`}>
            Alasan
          </label>
          <textarea
            id={`reason-${question?.id}`}
            value={value?.reason || ''}
            onChange={(e) => onChange({ reason: e.target.value })}
            disabled={preview}
            rows={4}
            placeholder="Jelaskan singkat alasan skor kepuasan di bawah 3"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          />
        </div>
      ) : null}
    </div>
  )
}
