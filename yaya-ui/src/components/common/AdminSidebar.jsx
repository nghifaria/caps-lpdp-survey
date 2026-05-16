import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/logo_lpdp.png";
import { UserCircle2 } from "lucide-react";
import { LogOut } from "lucide-react";

const adminData = {
    name: "Admin LPDP",
    email: "adminlpdp@gmail.com",
    avatar: null,
};

const AdminSidebar = () => {
    const navigate = useNavigate();
    const menuItems = [
        {
            name: "Dashboard",
            path: "/admin",
        },
        {
            name: "Respondents",
            path: "/admin/respondents",
        },
        {
            name: "Surveys",
            path: "/admin/surveys",
        },
        {
            name: "Reports",
            path: "/admin/reports",
        },
    ];

    return (
        <aside
            className="
                flex fixed left-0 top-0 h-screen w-[230px] flex-col
                justify-between
                bg-[#242428]
                px-5 py-6
                text-white">

            {/* Top Section */}
            <div className="pt-28">
                {/* Sidebar Header */}
                <div
                    className="
                        absolute left-0 top-0
                        flex h-24 w-full items-center gap-6
                        bg-light-grey
                        px-5 ">

                    {/* Logo */}
                    <img
                        src={logo}
                        alt="LPDP Logo"
                        className="h-10 w-auto object-contain"
                    />

                    {/* Title */}
                    <div className="leading-tight">

                        <h1 className="text-sm font-semibold text-oren-muda">
                            Survey
                        </h1>

                        <h1 className="text-sm font-semibold text-oren-muda">
                            Awardee LPDP
                        </h1>

                    </div>

                </div>
                {/* Navigation */}
                <nav className="flex flex-col gap-3">

                    {menuItems.map((item) => (

                        <NavLink
                            key={item.name}
                            to={item.path}

                            end={item.path === "/admin"}

                            className={({ isActive }) =>
                                `
                                rounded-xl px-5 py-3
                                text-sm font-medium
                                transition-all duration-300
                                
                                ${
                                    isActive
                                        ? "bg-oren-muda text-white"
                                        : "text-white hover:bg-[#DE7A49]/20"
                                }
                                `
                            }
                        >
                            {item.name}

                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Bottom Section */}
            <div>

                {/* User Info */}
                <div className="mb-5 flex items-center gap-1">

                    {/* Profile Avatar */}
                    <div
                        className="
                            flex h-14 w-14 items-center justify-center
                        "
                    >
                        <UserCircle2 size={30} className="text-white" />
                    </div>

                    {/* User Detail */}
                    <div>
                        <h2 className="text-sm font-semibold">
                            {adminData.name}
                        </h2>

                        <p className="text-xs text-gray-300">
                            {adminData.email}
                        </p>

                    </div>

                </div>

                {/* Logout Button */}
                <button
                    onClick={() => navigate("/login")}
                    className="
                        flex w-full items-center justify-center gap-2
                        rounded-xl bg-oren-muda
                        px-5 py-2
                        text-sm font-semibold text-white
                        transition-all duration-300
                        hover:bg-[#C9683B] ">

                    <LogOut size={15} />

                    <span>
                        Logout
                    </span>

                </button>
            </div>

        </aside>
    );
};

export default AdminSidebar;