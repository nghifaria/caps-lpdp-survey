interface QuestionProps {
  question: any
  value: string | null | undefined
  onChange: (val: string) => void
  preview?: boolean
}

export default function MultipleChoiceQuestion({ question, value, onChange, preview = false }: QuestionProps) {
  const options = Array.isArray(question?.options) ? question.options : []

  return (
    <div className="mt-4 space-y-3">
      {options.map((option: string, idx: number) => {
        const isSelected = value === option
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
              type="radio"
              name={`mc-${question?.id}`}
              value={option}
              checked={isSelected}
              onChange={() => !preview && onChange(option)}
              disabled={preview}
              className="h-4 w-4 border-light-grey text-oren focus:ring-oren-muda cursor-pointer disabled:cursor-not-allowed"
            />
            <span className="text-sm">{option}</span>
          </label>
        )
      })}
    </div>
  )
}
