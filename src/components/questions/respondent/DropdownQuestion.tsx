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
        className="w-full rounded-2xl border border-light-grey bg-white px-4 py-3 text-sm text-ash outline-none transition-shadow focus:border-oren focus:ring-4 focus:ring-oren/10 disabled:cursor-not-allowed disabled:bg-slate-50 cursor-pointer"
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
