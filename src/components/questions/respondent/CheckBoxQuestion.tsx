interface QuestionProps {
  question: any
  value: string | null | undefined
  onChange: (val: string) => void
  preview?: boolean
}

export default function CheckBoxQuestion({ question, value = '', onChange, preview = false }: QuestionProps) {
  const options = Array.isArray(question?.options) ? question.options : []

  // Safe parsing of multi-select values (JSON format or comma-separated string)
  let selectedValues: string[] = []
  if (value) {
    try {
      if (value.startsWith('[') && value.endsWith(']')) {
        selectedValues = JSON.parse(value)
      } else {
        selectedValues = value.split(',').map((s) => s.trim()).filter(Boolean)
      }
    } catch {
      selectedValues = value.split(',').map((s) => s.trim()).filter(Boolean)
    }
  }

  const handleToggle = (option: string) => {
    const nextValue = selectedValues.includes(option)
      ? selectedValues.filter((v) => v !== option)
      : [...selectedValues, option]
    onChange(JSON.stringify(nextValue))
  }

  return (
    <div className="mt-4 space-y-3">
      {options.map((option: string, idx: number) => {
        const isSelected = selectedValues.includes(option)
        return (
          <label
            key={idx}
            className={`flex items-center gap-3 cursor-pointer p-4 rounded-2xl border transition-all duration-200 select-none ${
              isSelected
                ? 'border-oren bg-oren-muda/5 text-ash font-medium shadow-sm'
                : 'border-light-grey bg-white text-ash/70 hover:bg-slate-50'
            } ${preview ? 'cursor-not-allowed opacity-80' : ''}`}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => !preview && handleToggle(option)}
              disabled={preview}
              className="h-4 w-4 rounded border-light-grey text-oren focus:ring-oren-muda cursor-pointer disabled:cursor-not-allowed"
            />
            <span className="text-sm">{option}</span>
          </label>
        )
      })}
    </div>
  )
}
