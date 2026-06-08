interface QuestionProps {
  question: any
  value: string
  onChange: (val: string) => void
  preview?: boolean
}

export default function LikertQuestion({ question, value, onChange, preview = false }: QuestionProps) {
  const values = [1, 2, 3, 4, 5]

  return (
    <div className="mt-4 flex items-center justify-around rounded-2xl border border-slate-200 bg-white p-4">
      {values.map((val) => (
        <label key={val} className="flex flex-col items-center gap-2 cursor-pointer hover:scale-105 transition-transform duration-200">
          <span className="text-xs font-semibold text-slate-500">{val}</span>
          <input
            type="radio"
            name={`likert-${question?.id}`}
            value={val}
            checked={value === String(val)}
            onChange={() => onChange(String(val))}
            disabled={preview}
            className="h-5 w-5 border-slate-300 text-[#d4af37] focus:ring-[#d4af37] hover:scale-110 transition-transform duration-200 cursor-pointer"
          />
        </label>
      ))}
    </div>
  )
}
