interface QuestionProps {
  question: any
  value: string | boolean | null | undefined
  onChange: (val: string) => void
  preview?: boolean
}

export default function TrueFalseQuestion({ question, value, onChange, preview = false }: QuestionProps) {
  // Normalize value to string 'true' or 'false'
  const normalizedValue =
    value === true || value === 'true'
      ? 'true'
      : value === false || value === 'false'
        ? 'false'
        : ''

  return (
    <div className="mt-4 flex flex-col sm:flex-row gap-4">
      <label
        className={`flex items-center gap-3 cursor-pointer p-4 rounded-2xl border transition-all duration-200 flex-1 select-none ${
          normalizedValue === 'true'
            ? 'border-oren bg-oren-muda/5 text-ash font-medium shadow-sm'
            : 'border-light-grey bg-white text-ash/70 hover:bg-slate-50'
        } ${preview ? 'cursor-not-allowed opacity-80' : ''}`}
      >
        <input
          type="radio"
          name={`tf-${question?.id}`}
          value="true"
          checked={normalizedValue === 'true'}
          onChange={() => !preview && onChange('true')}
          disabled={preview}
          className="h-4 w-4 border-light-grey text-oren focus:ring-oren-muda cursor-pointer disabled:cursor-not-allowed"
        />
        <span className="text-sm">True</span>
      </label>

      <label
        className={`flex items-center gap-3 cursor-pointer p-4 rounded-2xl border transition-all duration-200 flex-1 select-none ${
          normalizedValue === 'false'
            ? 'border-oren bg-oren-muda/5 text-ash font-medium shadow-sm'
            : 'border-light-grey bg-white text-ash/70 hover:bg-slate-50'
        } ${preview ? 'cursor-not-allowed opacity-80' : ''}`}
      >
        <input
          type="radio"
          name={`tf-${question?.id}`}
          value="false"
          checked={normalizedValue === 'false'}
          onChange={() => !preview && onChange('false')}
          disabled={preview}
          className="h-4 w-4 border-light-grey text-oren focus:ring-oren-muda cursor-pointer disabled:cursor-not-allowed"
        />
        <span className="text-sm">False</span>
      </label>
    </div>
  )
}
