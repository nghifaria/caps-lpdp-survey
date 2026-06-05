interface QuestionProps {
  question: any
  value: string
  onChange: (val: string) => void
  preview?: boolean
}

export default function TrueFalseQuestion({ question, value, onChange, preview = false }: QuestionProps) {
  return (
    <div className="mt-4 space-y-2">
      <label className="flex items-center gap-3">
        <input
          type="radio"
          name={`tf-${question?.id}`}
          value="true"
          checked={value === 'true'}
          onChange={() => onChange('true')}
          disabled={preview}
          className="h-4 w-4 border-gray-300 text-oren-muda focus:ring-oren-muda"
        />
        <span className="text-sm text-slate-700">True / Benar</span>
      </label>

      <label className="flex items-center gap-3">
        <input
          type="radio"
          name={`tf-${question?.id}`}
          value="false"
          checked={value === 'false'}
          onChange={() => onChange('false')}
          disabled={preview}
          className="h-4 w-4 border-gray-300 text-oren-muda focus:ring-oren-muda"
        />
        <span className="text-sm text-slate-700">False / Salah</span>
      </label>
    </div>
  )
}
