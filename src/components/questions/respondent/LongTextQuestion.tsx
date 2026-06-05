interface QuestionProps {
  value: string | null | undefined
  onChange: (val: string) => void
  preview?: boolean
}

export default function LongTextQuestion({ value, onChange, preview = false }: QuestionProps) {
  return (
    <div className="mt-4">
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={preview}
        rows={4}
        placeholder="Tulis jawaban panjang Anda di sini..."
        className="w-full rounded-2xl border border-light-grey bg-white px-4 py-3 text-sm text-ash outline-none transition-shadow focus:border-oren focus:ring-4 focus:ring-oren/10 disabled:cursor-not-allowed disabled:bg-slate-50"
      />
    </div>
  )
}
