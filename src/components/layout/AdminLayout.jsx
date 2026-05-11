import AdminTopbar from "../common/AdminTopbar";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../common/AdminSidebar";

const AdminLayout = () => {
    return (
        <div className="flex min-h-screen flex-col">

            {/* Navbar */}
            <AdminTopbar />

            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>

        </div>
    );
};

export default AdminLayout;