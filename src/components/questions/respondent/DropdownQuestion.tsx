interface QuestionProps {
  question: any
  value: string | null | undefined
  onChange: (val: string) => void
  preview?: boolean
}

export default function DropdownQuestion({ question, value, onChange, preview = false }: QuestionProps) {
  const options = Array.isArray(question?.options) ? question.options : []

  return (
    <div className="mt-4">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={preview}
        className="w-full rounded-2xl border border-light-grey bg-white px-4 py-3 text-sm text-ash outline-none transition-all duration-300 focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/10 disabled:cursor-not-allowed disabled:bg-slate-50 cursor-pointer hover:border-[#d4af37]/60"
      >
        <option value="">-- Pilih --</option>
        {options.map((option: string, idx: number) => (
          <option key={idx} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}
