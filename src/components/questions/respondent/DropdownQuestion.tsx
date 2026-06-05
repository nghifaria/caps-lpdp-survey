interface QuestionProps {
  question: any
  value: string
  onChange: (val: string) => void
  preview?: boolean
}

export default function DropdownQuestion({ question, value, onChange, preview = false }: QuestionProps) {
  const options = Array.isArray(question?.options) ? question.options : []

  return (
    <div>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={preview}
        className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
      >
        <option value="">Pilih salah satu</option>
        {options.map((option: string, idx: number) => (
          <option key={idx} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}
