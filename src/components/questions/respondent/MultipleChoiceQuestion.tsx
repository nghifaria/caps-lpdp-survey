interface QuestionProps {
  question: any
  value: string
  onChange: (val: string) => void
  preview?: boolean
}

export default function MultipleChoiceQuestion({ question, value, onChange, preview = false }: QuestionProps) {
  const options = Array.isArray(question?.options) ? question.options : []

  return (
    <div className="mt-4 space-y-2">
      {options.map((option: string, idx: number) => (
        <label key={idx} className="flex items-center gap-3">
          <input
            type="radio"
            name={`mc-${question?.id}`}
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
            disabled={preview}
            className="h-4 w-4 border-gray-300 text-oren-muda focus:ring-oren-muda"
          />
          <span className="text-sm text-slate-700">{option}</span>
        </label>
      ))}
    </div>
  )
}
