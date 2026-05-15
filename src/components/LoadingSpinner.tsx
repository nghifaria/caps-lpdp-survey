function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-10" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <svg className="h-10 w-10 animate-spin text-[#003366]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" className="opacity-20" stroke="currentColor" strokeWidth="4" />
          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <p className="text-sm font-medium text-[#003366]">Memuat data...</p>
      </div>
    </div>
  )
}

export default LoadingSpinner
