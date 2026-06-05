interface QuestionProps {
  question: any
  value: string[]
  onChange: (val: string[]) => void
  preview?: boolean
}

export default function CheckBoxQuestion({ question, value = [], onChange, preview = false }: QuestionProps) {
  const options = Array.isArray(question?.options) ? question.options : []

  const handleToggle = (option: string) => {
    const nextValue = value.includes(option)
      ? value.filter((v) => v !== option)
      : [...value, option]
    onChange(nextValue)
  }

  return (
    <div className="mt-4 space-y-2">
      {options.map((option: string, idx: number) => (
        <label key={idx} className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={value.includes(option)}
            onChange={() => handleToggle(option)}
            disabled={preview}
            className="h-4 w-4 rounded border-gray-300 text-oren-muda focus:ring-oren-muda"
          />
          <span className="text-sm text-slate-700">{option}</span>
        </label>
      ))}
    </div>
  )
}
