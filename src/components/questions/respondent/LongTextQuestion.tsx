interface QuestionProps {
  value: string
  onChange: (val: string) => void
  preview?: boolean
}

export default function LongTextQuestion({ value, onChange, preview = false }: QuestionProps) {
  return (
    <div>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={preview}
        rows={4}
        placeholder="Tulis jawaban panjang Anda di sini"
        className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
      />
    </div>
  )
}
