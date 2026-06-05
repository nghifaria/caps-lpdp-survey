interface QuestionProps {
  value: string | null | undefined
  onChange: (val: string) => void
  preview?: boolean
}

export default function ShortTextQuestion({ value, onChange, preview = false }: QuestionProps) {
  return (
    <div className="mt-4">
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={preview}
        placeholder="Tulis jawaban singkat Anda di sini..."
        className="w-full rounded-2xl border border-light-grey bg-white px-4 py-3 text-sm text-ash outline-none transition-shadow focus:border-oren focus:ring-4 focus:ring-oren/10 disabled:cursor-not-allowed disabled:bg-slate-50"
      />
    </div>
  )
}
