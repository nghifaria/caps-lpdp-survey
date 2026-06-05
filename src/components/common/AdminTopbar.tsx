const AdminTopbar = () => {
  const today = new Date()

  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <header className="sticky top-0 z-50 bg-[#E7E4DC] shadow-sm print:hidden">
      <div className="flex h-16 items-center justify-end px-6 md:px-10">
        <div>
          <h1 className="text-sm font-medium text-[#2B2B2B]">
            {formattedDate}
          </h1>
        </div>
      </div>
    </header>
  )
}

export default AdminTopbar
