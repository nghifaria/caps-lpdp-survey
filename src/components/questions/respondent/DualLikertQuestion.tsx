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
    <div className="mt-5 space-y-4 w-full">
      <div className="overflow-x-auto rounded-2xl border border-light-grey bg-white">
        <table className="w-full min-w-[500px] border-collapse text-sm text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-light-grey text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <th className="px-4 py-3">Dimensi</th>
              {likertValues.map((val) => (
                <th key={val} className="px-2 py-3 text-center border-l border-light-grey w-[12%]">
                  {val}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-light-grey">
            <tr className="border-b border-light-grey">
              <td className="px-4 py-4 font-medium text-ash bg-white">Kepentingan</td>
              {likertValues.map((val) => (
                <td key={`importance-${val}`} className="p-0 border-l border-light-grey text-center bg-white">
                  <label className="flex h-full w-full items-center justify-center py-4 cursor-pointer hover:scale-105 transition-transform duration-200">
                    <input
                      type="radio"
                      name={`importance-${question?.id}`}
                      value={val}
                      checked={value?.scoreImportance === String(val)}
                      onChange={() => onChange({ scoreImportance: String(val) })}
                      disabled={preview}
                      className="h-5 w-5 text-[#d4af37] focus:ring-[#d4af37] border-light-grey cursor-pointer transition-transform duration-200 hover:scale-110"
                    />
                  </label>
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-4 font-medium text-ash bg-white">Kepuasan</td>
              {likertValues.map((val) => (
                <td key={`performance-${val}`} className="p-0 border-l border-light-grey text-center bg-white">
                  <label className="flex h-full w-full items-center justify-center py-4 cursor-pointer hover:scale-105 transition-transform duration-200">
                    <input
                      type="radio"
                      name={`performance-${question?.id}`}
                      value={val}
                      checked={value?.scorePerformance === String(val)}
                      onChange={() => onChange({ scorePerformance: String(val) })}
                      disabled={preview}
                      className="h-5 w-5 text-[#d4af37] focus:ring-[#d4af37] border-light-grey cursor-pointer transition-transform duration-200 hover:scale-110"
                    />
                  </label>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {showReason ? (
        <div className="animate-fade-in">
          <label className="text-sm font-medium text-ash" htmlFor={`reason-${question?.id}`}>
            Alasan
          </label>
          <textarea
            id={`reason-${question?.id}`}
            value={value?.reason || ''}
            onChange={(e) => onChange({ reason: e.target.value })}
            disabled={preview}
            rows={4}
            placeholder="Jelaskan singkat alasan skor kepuasan di bawah 3"
            className="mt-2 w-full rounded-2xl border border-light-grey bg-white px-4 py-3 text-sm text-ash outline-none transition focus:border-oren focus:ring-4 focus:ring-oren/10 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
      ) : null}
    </div>
  )
}
