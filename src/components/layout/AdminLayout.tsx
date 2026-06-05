import { Outlet } from 'react-router-dom'
import AdminSidebar from '../common/AdminSidebar'
import AdminTopbar from '../common/AdminTopbar'

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-[#F7F5EF]">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Right Section */}
      <div className="ml-[230px] flex flex-1 flex-col">
        {/* Topbar */}
        <AdminTopbar />

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
