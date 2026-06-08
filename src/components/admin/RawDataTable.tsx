export type CsvRow = {
  response_id: string
  submitted_at: string
  question_id: string
  question_text: string
  performance: number
  importance: number
  reason: string
}

interface RawDataTableProps {
  csvRows: CsvRow[]
  quadrantMap: Map<string, string>
  exportCsv: () => void
  handlePrintReport: () => void
}

export default function RawDataTable({
  csvRows,
  quadrantMap,
  exportCsv,
  handlePrintReport,
}: RawDataTableProps) {
  return (
    <div className="mt-8 space-y-6 print:hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ash">Raw Data</h2>
          <p className="mt-1 text-sm text-ash/80">
            Jawaban mentah untuk analisis lanjutan atau ekspor CSV.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 print:hidden">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center justify-center rounded-xl bg-oren px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-95 cursor-pointer"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={handlePrintReport}
            className="inline-flex items-center justify-center rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-95 cursor-pointer"
          >
            Cetak Laporan PDF
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-[#E7E4DC] bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E7E4DC] text-left text-sm">
            <thead className="bg-[#E7E4DC]/55 text-xs uppercase tracking-[0.16em] text-ash/70">
              <tr>
                <th className="px-4 py-3">Response ID</th>
                <th className="px-4 py-3">Submitted At</th>
                <th className="px-4 py-3">Question</th>
                <th className="px-4 py-3">Performance</th>
                <th className="px-4 py-3">Importance</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Quadrant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E4DC]">
              {csvRows.map((row) => (
                <tr
                  key={`${row.response_id}-${row.question_id}`}
                  className="hover:bg-[#fff9eb]/50 transition-colors duration-200"
                >
                  <td className="px-4 py-3 text-ash/80">{row.response_id}</td>
                  <td className="px-4 py-3 text-ash/80">{row.submitted_at}</td>
                  <td className="px-4 py-3 font-medium text-ash">{row.question_text}</td>
                  <td className="px-4 py-3 text-ash/80">{row.performance}</td>
                  <td className="px-4 py-3 text-ash/80">{row.importance}</td>
                  <td className="px-4 py-3 text-ash/80">{row.reason || '-'}</td>
                  <td className="px-4 py-3 text-ash/80">
                    {quadrantMap.get(row.question_id) ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
